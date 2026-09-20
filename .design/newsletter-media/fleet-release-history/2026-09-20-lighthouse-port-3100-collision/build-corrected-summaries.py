#!/usr/bin/env python3
"""Validate the re-run Lighthouse reports (free port, identity-captured) and build corrected
summaries in the fleet runner's schema. --apply replaces the invalid per-site summaries after
archiving the originals and annotates the release reports; without it, only scratch output."""
import json, hashlib, os, sys, shutil, subprocess
S=os.path.dirname(os.path.abspath(__file__)); ROOT='/srv/apps/velvetdinosaur/.design/newsletter-media'
FINAL=f'{ROOT}/fleet-release-final'; ARC=f'{ROOT}/fleet-release-history/2026-09-20-lighthouse-port-3100-collision'
PORT=int(sys.argv[sys.argv.index('--port')+1]) if '--port' in sys.argv else 31921
CATS=['performance','accessibility','best-practices','seo']
sha=lambda b: hashlib.sha256(b).hexdigest()
apply='--apply' in sys.argv; results={}
for site in ['witney-dental-practice','witney-hotel','woodstock-dental']:
    out=f'{S}/{site}'; clone=f'/srv/apps/.ops/newsletter-media/{site}'
    commit=subprocess.run(['git','-C',clone,'rev-parse','HEAD'],capture_output=True,text=True).stdout.strip()
    release=json.load(open(f'{FINAL}/{site}.json')); assert release['commit']==commit, (site, release['commit'], commit)
    started=open(f'{out}/started-at').read().strip(); finished=open(f'{out}/finished-at').read().strip()
    summary={'version':1,'site':site,'commit':commit,'qualityStartedAt':started,'checkedAt':finished,'status':'failed','viewports':[]}
    problems=[]
    for vp in ['mobile','desktop']:
        cfg_bytes=open(f'{out}/lighthouserc.{vp}.json','rb').read(); cfg=json.loads(cfg_bytes); col=cfg['ci']['collect']
        orig=json.load(open(f'{clone}/lighthouserc.{vp}.json'))
        # identical to the committed config except port and output dir
        o=json.loads(json.dumps(orig)); o['ci']['collect']['startServerCommand']=col['startServerCommand']; o['ci']['collect']['url']=col['url']; o['ci']['upload']['outputDir']=cfg['ci']['upload']['outputDir']
        if o!=cfg: problems.append(f'{vp}: temp config differs beyond port/outputDir')
        urls=col['url']; assert all(u.startswith(f'http://localhost:{PORT}/') for u in urls)
        man_bytes=open(f'{out}/{vp}/manifest.json','rb').read(); manifest=json.loads(man_bytes)
        listeners={l.split(' cwd=')[1].strip() for l in open(f'{out}/{vp}-listener.log') if ' cwd=' in l}
        if listeners!={clone}: problems.append(f'{vp}: listener cwds {listeners}')
        ev={'viewport':vp,'configSha256':sha(cfg_bytes),'manifestSha256':sha(man_bytes),'pages':[{'url':u.replace(f'http://localhost:{PORT}',''),'runs':[],'categories':{}} for u in urls]}
        seen=set()
        for entry in manifest:
            idx=urls.index(entry['url']); b=open(entry['jsonPath'],'rb').read(); d=json.loads(b); h=sha(b)
            if h in seen: problems.append(f'{vp}: duplicate report'); 
            seen.add(h)
            if d.get('runtimeError') or d['configSettings']['formFactor']!=vp or d['requestedUrl']!=entry['url']: problems.append(f'{vp}: report mismatch {entry["jsonPath"]}')
            if not (started<=d['fetchTime']<=finished): problems.append(f'{vp}: stale report {d["fetchTime"]}')
            reqs=[i['url'] for i in d['audits']['network-requests']['details']['items']]
            if any('white-rose-accountancy' in u for u in reqs): problems.append(f'{vp}: white-rose URLs present')
            if not all(u.startswith(f'http://localhost:{PORT}/') or not u.startswith('http://localhost') for u in reqs): problems.append(f'{vp}: request to another local port')
            scores={c:d['categories'][c]['score'] for c in CATS}
            if any(s is None for s in scores.values()): problems.append(f'{vp}: missing category score')
            ev['pages'][idx]['runs'].append({'fetchedAt':d['fetchTime'],'report':os.path.relpath(entry['jsonPath'],S),'sha256':h,'scores':scores})
        for pg in ev['pages']:
            if len(pg['runs'])!=3: problems.append(f'{vp}: {pg["url"]} has {len(pg["runs"])} runs')
            pg['runs'].sort(key=lambda r:r['fetchedAt'])
            for c in CATS:
                sc=[r['scores'][c] for r in pg['runs']]; med=sorted(sc)[1] if len(sc)==3 else None
                pg['categories'][c]={'scores':sc,'median':med}
                if med!=1: problems.append(f'{vp}: {pg["url"]} {c} median {med} scores {sc}')
        summary['viewports'].append(ev)
    summary['status']='passed' if not problems else 'failed'
    summary['correction']={'reason':'Original gate reports audited the live white-rose-accountancy green slot (port 3100 collision); see fleet-release-history/2026-09-20-lighthouse-port-3100-collision/','port':PORT,'server':'candidate build from the isolated clone, identical committed lighthouserc except port/outputDir','listenerCwd':clone,'originalSummaryArchived':f'{os.path.relpath(ARC,ROOT)}/{site}/original-lighthouse-summary.json','problems':problems}
    results[site]={'status':summary['status'],'problems':problems,'medians':{f"{v['viewport']} {p['url']}":{c:p['categories'][c]['median'] for c in CATS} for v in summary['viewports'] for p in v['pages']}}
    json.dump(summary,open(f'{out}/{site}-lighthouse-summary.corrected.json','w'),indent=2)
    if apply and not problems:
        os.makedirs(f'{ARC}/{site}',exist_ok=True); os.chmod(ARC,0o700)
        shutil.copy2(f'{FINAL}/{site}-lighthouse-summary.json', f'{ARC}/{site}/original-lighthouse-summary.json')
        shutil.copytree(f'{clone}/.lighthouseci', f'{ARC}/{site}/original-raw-reports', dirs_exist_ok=True)
        shutil.copytree(out, f'{ARC}/{site}/rerun', dirs_exist_ok=True)
        json.dump(summary,open(f'{FINAL}/{site}-lighthouse-summary.json','w'),indent=2); os.chmod(f'{FINAL}/{site}-lighthouse-summary.json',0o600)
        release['lighthouseCorrection']={'at':finished,'originalSummary':f'{os.path.relpath(ARC,ROOT)}/{site}/original-lighthouse-summary.json','reason':summary['correction']['reason'],'correctedSummary':f'fleet-release-final/{site}-lighthouse-summary.json','status':'passed'}
        json.dump(release,open(f'{FINAL}/{site}.json','w'),indent=2)
print(json.dumps(results,indent=1))
