import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
let renderer, scene, camera, rig, float, orbit, pts, lightA, lightB, introAction, tex, cv, cx, mx = 0, my = 0, loadSeq = 0, curKey = "";
const mixers = [];
const hue = n => { let h = 0; for (const c of String(n || "")) h = (h * 31 + c.charCodeAt(0)) % 360; return h };
export function initScene(canvas) {
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { canvas.style.display = "none"; return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(40, 1, .1, 100); camera.position.set(0, 0, 9);
  scene.add(new THREE.AmbientLight(0x8890ff, .8));
  lightA = new THREE.PointLight(0x7c5cff, 140, 40); lightA.position.set(4, 4, 6);
  lightB = new THREE.PointLight(0x22d3ee, 100, 40); lightB.position.set(-5, -2, 4); scene.add(lightA, lightB);
  rig = new THREE.Group(); float = new THREE.Group(); rig.add(float); scene.add(rig);
  const body = new THREE.Mesh(new RoundedBoxGeometry(2.1, 4.2, .28, 6, .28), new THREE.MeshStandardMaterial({ color: 0x1a1d29, metalness: .9, roughness: .22 }));
  cv = document.createElement("canvas"); cv.width = 512; cv.height = 1056; cx = cv.getContext("2d");
  tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.94, 4.04), new THREE.MeshBasicMaterial({ map: tex })); scr.position.z = .145;
  float.add(body, scr);
  orbit = new THREE.Group(); float.add(orbit);
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2, m = new THREE.Mesh(new RoundedBoxGeometry(.5, .5, .5, 4, .14), new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(i / 7, .8, .55), emissive: new THREE.Color().setHSL(i / 7, .8, .25), metalness: .4, roughness: .3 }));
    m.position.set(Math.cos(a) * 2.7, Math.sin(a * 2) * 1.3, Math.sin(a) * 1.6); m.rotation.set(a, a * 2, 0); orbit.add(m);
  }
  const g = new Float32Array(900);
  for (let i = 0; i < 900; i += 3) { const r = 6 + Math.random() * 14, t = Math.random() * 6.28, p = Math.acos(2 * Math.random() - 1); g[i] = r * Math.sin(p) * Math.cos(t); g[i + 1] = r * Math.sin(p) * Math.sin(t); g[i + 2] = r * Math.cos(p) - 6 }
  pts = new THREE.Points(new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(g, 3)), new THREE.PointsMaterial({ size: .05, color: 0x9aa8ff, transparent: true, opacity: .7 })); scene.add(pts);

  // ---- Keyframe clips + mixers ----
  const q = (x, y, z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z)).toArray();
  const bob = new THREE.AnimationClip("float", 8, [
    new THREE.VectorKeyframeTrack(".position", [0, 2, 4, 6, 8], [0, 0, 0, 0, .25, 0, 0, 0, 0, 0, -.2, 0, 0, 0, 0]),
    new THREE.QuaternionKeyframeTrack(".quaternion", [0, 2, 4, 6, 8], [q(.05, -.35, 0), q(-.04, .1, .03), q(.05, .4, 0), q(-.04, .1, -.03), q(.05, -.35, 0)].flat())]);
  bob.tracks.forEach(t => t.setInterpolation(THREE.InterpolateSmooth));
  const intro = new THREE.AnimationClip("intro", .9, [new THREE.VectorKeyframeTrack(".scale", [0, .9], [.3, .3, .3, 1, 1, 1])]);
  const ay = a => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), a).toArray();
  const spin = new THREE.AnimationClip("orbit", 22, [new THREE.QuaternionKeyframeTrack(".quaternion", [0, 7, 14, 22], [ay(0), ay(2.09), ay(4.19), ay(6.28)].flat())]);
  const mF = new THREE.AnimationMixer(float), mO = new THREE.AnimationMixer(orbit); mixers.push(mF, mO);
  mF.clipAction(bob).play(); mO.clipAction(spin).play();
  introAction = mF.clipAction(intro); introAction.setLoop(THREE.LoopOnce, 1); introAction.clampWhenFinished = true; introAction.play();

  addEventListener("pointermove", e => { mx = e.clientX / innerWidth * 2 - 1; my = e.clientY / innerHeight * 2 - 1 });
  const rs = () => { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix() }; rs(); addEventListener("resize", rs);
  const timer = new THREE.Timer(); timer.connect(document);
  renderer.setAnimationLoop(() => {
    timer.update(); const d = timer.getDelta(), D = THREE.MathUtils.damp;
    mixers.forEach(m => m.update(d));
    const vw = 2 * Math.tan(THREE.MathUtils.degToRad(20)) * 9 * camera.aspect, wide = innerWidth > 800, sy = scrollY;
    const s = (wide ? 1 : .55) * Math.max(0, 1 - sy / (innerHeight * .8));
    rig.position.x = D(rig.position.x, wide ? vw * .24 : 0, 4, d);
    rig.position.y = D(rig.position.y, (wide ? 0 : 2.2) + sy * .004, 4, d);
    rig.scale.setScalar(D(rig.scale.x, Math.max(s, .001), 5, d));
    camera.position.x = D(camera.position.x, mx * .8, 3, d); camera.position.y = D(camera.position.y, -my * .5, 3, d); camera.lookAt(0, 0, 0);
    pts.rotation.y += d * .02;
    renderer.render(scene, camera);
  });
}
export function setApp(a) {
  if (!renderer || !a) return;
  const safeName = String(a.name || "App"), initial = (safeName.trim()[0] || "A").toUpperCase(), key = String(a.id) + "|" + safeName;
  if (key === curKey) return; curKey = key; // same app again: no flicker / no intro replay
  const seq = ++loadSeq, h = hue(safeName), W = 512, H = 1056, x = cx;
  const draw = img => {
    if (seq !== loadSeq) return; // stale image load
    const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, `hsl(${h},75%,50%)`); g.addColorStop(1, `hsl(${(h + 60) % 360},70%,22%)`);
    x.fillStyle = g; x.fillRect(0, 0, W, H); x.textAlign = "start";
    x.fillStyle = "rgba(255,255,255,.9)"; x.font = "600 26px Inter,sans-serif"; x.fillText("9:41", 40, 56);
    x.save(); x.beginPath(); x.roundRect(146, 250, 220, 220, 52); x.clip();
    if (img) x.drawImage(img, 146, 250, 220, 220); else { x.fillStyle = `hsl(${h},60%,35%)`; x.fillRect(146, 250, 220, 220); x.fillStyle = "#fff"; x.font = "800 120px Inter,sans-serif"; x.textAlign = "center"; x.fillText(initial, 256, 408) }
    x.restore(); x.textAlign = "center"; x.fillStyle = "#fff"; x.font = "800 44px Inter,sans-serif"; x.fillText(safeName.slice(0, 18), 256, 560);
    x.fillStyle = "rgba(255,255,255,.75)"; x.font = "500 26px Inter,sans-serif"; x.fillText(String(a.developer || ""), 256, 604);
    x.fillStyle = "#fff"; x.beginPath(); x.roundRect(136, 680, 240, 78, 39); x.fill(); x.fillStyle = `hsl(${h},70%,30%)`; x.font = "700 30px Inter,sans-serif"; x.fillText("INSTALL", 256, 730);
    tex.needsUpdate = true;
  };
  draw(null);
  if (a.icon_url) { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => draw(i); i.onerror = () => draw(null); i.src = a.icon_url }
  lightA.color.setHSL(h / 360, .8, .6); lightB.color.setHSL(((h + 150) % 360) / 360, .8, .55);
  introAction.reset().play();
}
