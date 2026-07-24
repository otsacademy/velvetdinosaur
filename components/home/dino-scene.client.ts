import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

import { buildDino } from "./dino-model"

// Mounts the interactive hero dinosaur into `host` and returns a dispose
// function. This module is only ever loaded via dynamic import so three.js
// stays out of the main bundle.
export function mountDinoScene(host: HTMLElement): () => void {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%"

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 100)
  camera.position.set(2.1, 1.15, 2.5)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(0, 0.55, 0)
  controls.enableZoom = false
  controls.enablePan = false
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.autoRotate = true
  controls.autoRotateSpeed = 1.6
  controls.maxPolarAngle = Math.PI * 0.55
  controls.addEventListener("start", () => {
    controls.autoRotate = false
  })

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd7e3f4, 1.1))
  const key = new THREE.DirectionalLight(0xffffff, 2.0)
  key.position.set(3, 6, 4)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.bias = -0.0002
  scene.add(key)
  const fill = new THREE.DirectionalLight(0xe8f1fa, 0.5)
  fill.position.set(-4, 2, -3)
  scene.add(fill)

  const dino = buildDino(THREE)
  dino.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true
      o.receiveShadow = true
    }
  })
  scene.add(dino)

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.ShadowMaterial({ opacity: 0.14 }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  const fit = () => {
    const w = host.clientWidth || 1
    const h = host.clientHeight || 1
    renderer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  host.appendChild(renderer.domElement)
  fit()
  const ro = new ResizeObserver(fit)
  ro.observe(host)

  const renderLoop = () => {
    controls.update()
    renderer.render(scene, camera)
  }
  // only burn frames while the panel is on screen
  const visibility = new IntersectionObserver((entries) => {
    const visible = entries.some((entry) => entry.isIntersecting)
    renderer.setAnimationLoop(visible ? renderLoop : null)
  })
  visibility.observe(host)
  renderer.setAnimationLoop(renderLoop)

  return () => {
    visibility.disconnect()
    ro.disconnect()
    renderer.setAnimationLoop(null)
    controls.dispose()
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (mesh.isMesh) {
        mesh.geometry.dispose()
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        materials.forEach((m) => m.dispose())
      }
    })
    renderer.dispose()
    renderer.domElement.remove()
  }
}
