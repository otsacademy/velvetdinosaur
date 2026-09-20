#!/bin/bash
S=/tmp/claude-1000/-srv-apps-scholardemia/5c415cde-d12d-4db0-b456-bb407ea22831/scratchpad/lhfix; PORT=31921
log(){ echo "$(date -u +%FT%TZ) $*" | tee -a $S/progress.log; }
for site in witney-dental-practice witney-hotel woodstock-dental; do
  clone=/srv/apps/.ops/newsletter-media/$site; out=$S/$site; mkdir -p $out
  for vp in mobile desktop; do
    python3 - "$clone" "$out" "$vp" "$PORT" <<'PY'
import json,sys; clone,out,vp,port=sys.argv[1:5]
c=json.load(open(f'{clone}/lighthouserc.{vp}.json')); col=c['ci']['collect']
assert col['startServerCommand']=='bun run start -- -p 3100' and all(u.startswith('http://localhost:3100/') for u in col['url']) and col['numberOfRuns']==3
col['startServerCommand']=f'bun run start -- -p {port}'; col['url']=[u.replace('http://localhost:3100/',f'http://localhost:{port}/') for u in col['url']]
c['ci']['upload']['outputDir']=f'{out}/{vp}'
json.dump(c,open(f'{out}/lighthouserc.{vp}.json','w'),indent=2)
PY
  done
  ss -ltn | grep -q ":$PORT " && { log "$site: port $PORT busy; abort"; exit 1; }
  echo "$(date -u +%FT%TZ)" > $out/started-at
  for vp in mobile desktop; do
    log "$site $vp: lhci start"
    ( while sleep 2; do l=$(ss -ltnp 2>/dev/null | grep ":$PORT " | grep -o 'pid=[0-9]*' | head -1 | cut -d= -f2); [ -n "$l" ] && echo "$(date -u +%FT%TZ) pid=$l cwd=$(readlink -f /proc/$l/cwd 2>/dev/null)" >> $out/$vp-listener.log; done ) & poller=$!
    cd /srv/apps/velvetdinosaur && bun --no-env-file $S/lhci-run.ts $site $out/lighthouserc.$vp.json > $out/$vp-lhci.log 2>&1; code=$?
    kill $poller 2>/dev/null; wait $poller 2>/dev/null
    log "$site $vp: lhci exit=$code reports=$(ls $out/$vp/*.report.json 2>/dev/null | wc -l) listener-cwds=$(cut -d' ' -f3 $out/$vp-listener.log 2>/dev/null | sort -u | tr '\n' ' ')"
    for i in $(seq 1 15); do ss -ltn | grep -q ":$PORT " || break; sleep 1; done
  done
  echo "$(date -u +%FT%TZ)" > $out/finished-at
done
log "ALL DONE"
