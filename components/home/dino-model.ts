import type * as ThreeNS from "three"

type Three = typeof ThreeNS

// Velvet Dinosaur mascot — programmatic three.js model, ported from the
// claude.ai/design project (dino-model.js). Built as one continuous spine
// (tail tip → body → neck → head → snout) with a smooth radius profile so it
// reads as a soft one-piece toy.
export function buildDino(THREE: Three): ThreeNS.Group {
  const blue = new THREE.MeshStandardMaterial({ color: 0x2679ec, roughness: 0.6, metalness: 0 })
  blue.name = "dinoBlue"
  const dark = new THREE.MeshStandardMaterial({ color: 0x101418, roughness: 0.35, metalness: 0 })
  dark.name = "inkBlack"
  const glint = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0 })
  glint.name = "glintWhite"

  const g = new THREE.Group()
  g.name = "velvet_dinosaur"
  // One shared unit sphere per segment count, scaled per mesh — building 150+
  // unique SphereGeometries cost ~400ms of main-thread time on mobile.
  const unitSpheres = new Map<number, ThreeNS.SphereGeometry>()
  const S = (seg: number) => {
    let geo = unitSpheres.get(seg)
    if (!geo) {
      geo = new THREE.SphereGeometry(1, seg, seg)
      unitSpheres.set(seg, geo)
    }
    return geo
  }
  const addSphere = (
    name: string,
    radius: number,
    seg: number,
    mat: ThreeNS.Material,
    x: number,
    y: number,
    z: number,
    sx = 1,
    sy = 1,
    sz = 1,
  ) => {
    const m = new THREE.Mesh(S(seg), mat)
    m.name = name
    m.position.set(x, y, z)
    m.scale.set(radius * sx, radius * sy, radius * sz)
    g.add(m)
    return m
  }

  // spine: [x, y, radius] — tail tip → hips → belly → chest → neck → crown → snout tip
  const spine: Array<[number, number, number]> = [
    [-1.02, 0.46, 0.012], // tail tip, curled up
    [-0.92, 0.34, 0.05],
    [-0.62, 0.3, 0.13],
    [-0.24, 0.42, 0.3], // hips (fullest)
    [0.06, 0.45, 0.315], // belly/mid
    [0.3, 0.5, 0.26], // chest/shoulder
    [0.46, 0.7, 0.155], // neck base
    [0.53, 0.92, 0.115], // neck mid
    [0.55, 1.08, 0.105], // neck top
    [0.6, 1.17, 0.122], // head/crown
    [0.7, 1.135, 0.095], // snout mid
    [0.765, 1.075, 0.058], // snout tip, blunt, pointing forward-down
  ]
  const curve = new THREE.CatmullRomCurve3(spine.map((p) => new THREE.Vector3(p[0], p[1], 0)))
  const nSeg = spine.length - 1
  const smooth = (a: number, b: number, f: number) => a + (b - a) * (f * f * (3 - 2 * f))
  const radiusAt = (t: number) => {
    const u = Math.min(t * nSeg, nSeg - 1e-6)
    const i = Math.floor(u)
    return Math.max(0.012, smooth(spine[i][2], spine[i + 1][2], u - i))
  }
  const COUNT = 150
  for (let i = 0; i < COUNT; i++) {
    const t = i / (COUNT - 1)
    const p = curve.getPoint(t)
    addSphere("spine_" + String(i).padStart(3, "0"), radiusAt(t), 24, blue, p.x, p.y, p.z)
  }

  // eyes — large friendly beads on the sides of the head, with glints
  addSphere("eye_left", 0.03, 20, dark, 0.652, 1.165, 0.1, 0.75, 1, 1)
  addSphere("eye_right", 0.03, 20, dark, 0.652, 1.165, -0.1, 0.75, 1, 1)
  addSphere("glint_left", 0.0095, 12, glint, 0.664, 1.176, 0.113)
  addSphere("glint_right", 0.0095, 12, glint, 0.664, 1.176, -0.113)

  // smile — thin arc on the side of the snout
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.005, 12, 32, Math.PI * 0.7), dark)
  smile.name = "smile"
  smile.position.set(0.752, 1.06, 0.04)
  smile.rotation.set(0, Math.PI / 2 - 0.3, Math.PI + 0.25)
  g.add(smile)

  // back bumps over the hips
  addSphere("bump_a", 0.05, 24, blue, -0.02, 0.755, 0)
  addSphere("bump_b", 0.047, 24, blue, -0.17, 0.735, 0)
  addSphere("bump_c", 0.042, 24, blue, -0.31, 0.685, 0)

  // legs — thick, short, wide-set; slight flare at the foot
  const legGeo = new THREE.CylinderGeometry(0.105, 0.122, 0.3, 28)
  const legs: Array<[string, number, number]> = [
    ["leg_front_left", 0.27, 0.17],
    ["leg_front_right", 0.27, -0.17],
    ["leg_back_left", -0.23, 0.17],
    ["leg_back_right", -0.23, -0.17],
  ]
  legs.forEach(([n, x, z]) => {
    const leg = new THREE.Mesh(legGeo, blue)
    leg.name = n
    leg.position.set(x, 0.15, z)
    g.add(leg)
  })
  return g
}
