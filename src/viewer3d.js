import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import registry from './model-assets.json' with { type: 'json' };
import { defaultAnchors, schematicSpec, validateModelAsset, inspectGlb } from './model-spec.js';

const Y = new THREE.Vector3(0, 1, 0);
const vector = a => new THREE.Vector3(...a);
function release(root) {
 if (root.userData?.imported) return;
 root.geometry?.dispose();
 const materials = root.material ? (Array.isArray(root.material) ? root.material : [root.material]) : [];
 for (const material of materials) { for (const value of Object.values(material)) if (value?.isTexture) value.dispose(); material.dispose(); }
 for (const child of root.children || []) release(child);
}
function releaseImported(root) {
 root.traverse(object => {
  object.geometry?.dispose();
  for (const material of (object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : [])) {
   for (const value of Object.values(material)) if (value?.isTexture) value.dispose();
   material.dispose();
  }
 });
}
function material(color, metalness = 0.45) { return new THREE.MeshStandardMaterial({ color, metalness, roughness: 0.4 }); }
function tube(group, start, end, radius, mat) {
 const a = vector(start), b = vector(end), direction = b.clone().sub(a);
 const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 12), mat);
 mesh.position.copy(a.add(b).multiplyScalar(0.5));mesh.quaternion.setFromUnitVectors(Y, direction.normalize());group.add(mesh);return mesh;
}
function curved(group, points, radius, mat) {
 const path = new THREE.CatmullRomCurve3(points.map(vector));
 const mesh = new THREE.Mesh(new THREE.TubeGeometry(path, 24, radius, 8, false), mat);group.add(mesh);return mesh;
}
function annulus(group, radius, depth, width, mat, z = 0) {
 const shape = new THREE.Shape();shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
 const hole = new THREE.Path();hole.absarc(0, 0, radius - depth, 0, Math.PI * 2, true);shape.holes.push(hole);
 const geometry = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false, curveSegments: 48 });geometry.translate(0, 0, z - width / 2);
 const mesh = new THREE.Mesh(geometry, mat);group.add(mesh);return mesh;
}
function box(group, size, position, mat) {
 const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);mesh.position.set(...position);group.add(mesh);return mesh;
}

function buildSchematic(parts, anchors) {
 const spec = schematicSpec(parts), root = new THREE.Group();
 const groups = Object.fromEntries(['frame', 'wheels', 'tires', 'drivetrain', 'brakes', 'cockpit', 'saddle'].map(key => { const group = new THREE.Group();group.name = key;root.add(group);return [key, group]; }));
 const paint = material(spec.frameColor), black = material('#17201a', 0.25), metal = material('#aeb7af', 0.85), carbon = material('#333e36');
 const a = anchors;
 for (const [start, end] of [[a.bottomBracket, a.seatTop], [a.bottomBracket, a.headBottom], [a.seatTop, a.headTop], [a.headBottom, a.headTop]]) tube(groups.frame, start, end, spec.tubeRadius, paint);
 for (const sign of [-1, 1]) {
  const rear = [...a.rearAxle];rear[2] = sign * 0.035;
  tube(groups.frame, a.seatTop, rear, 0.008, paint);tube(groups.frame, a.bottomBracket, rear, 0.01, paint);
  const front = [...a.frontAxle];front[2] = sign * 0.035;
  curved(groups.frame, [[a.headBottom[0], a.headBottom[1], sign * 0.025], [a.headBottom[0] + 0.055, 0.54, sign * 0.035], front], 0.011, paint);
 }
 const seat = [a.seatTop[0] - 0.03, a.seatTop[1] + 0.15, 0];tube(groups.frame, a.seatTop, seat, 0.012, carbon);
 for (const location of [a.rearAxle, a.frontAxle]) {
  const wheel = new THREE.Group();wheel.position.set(...location);groups.wheels.add(wheel);
  const tire=new THREE.Mesh(new THREE.TorusGeometry(0.321, spec.tireRadius, 10, 64), black);tire.position.set(...location);groups.tires.add(tire);
  annulus(wheel, 0.308, spec.rimDepth, 0.022, carbon);
  tube(wheel, [0, 0, -0.035], [0, 0, 0.035], 0.022, metal);
  const points = [];
  for (let i = 0; i < 24; i++) { const angle = i / 24 * Math.PI * 2;points.push(0, 0, i % 2 ? 0.025 : -0.025, Math.cos(angle) * (0.308 - spec.rimDepth), Math.sin(angle) * (0.308 - spec.rimDepth), 0); }
  const spokes = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(points, 3)), new THREE.LineBasicMaterial({ color: '#89948b' }));wheel.add(spokes);
  const rotor = new THREE.Group();rotor.position.set(...location);annulus(rotor, 0.075, 0.016, 0.002, metal, -0.045);groups.brakes.add(rotor);
  box(groups.brakes, [0.035, 0.05, 0.035], [location[0] - 0.035, location[1] + 0.045, -0.05], black);
 }
 const crank = new THREE.Group();crank.position.set(...a.bottomBracket);groups.drivetrain.add(crank);
 annulus(crank, 0.082, 0.013, 0.006, metal, 0.065);
 tube(crank, [0, 0, 0.07], [0.08, -0.125, 0.08], 0.014, black);box(crank, [0.08, 0.025, 0.045], [0.08, -0.125, 0.09], black);
 tube(crank, [0, 0, -0.07], [-0.08, 0.125, -0.08], 0.014, black);box(crank, [0.08, 0.025, 0.045], [-0.08, 0.125, -0.09], black);
 for (let i = 0; i < 5; i++) { const cog = new THREE.Group();cog.position.set(...a.rearAxle);annulus(cog, 0.052 - i * 0.005, 0.008, 0.004, metal, 0.04 + i * 0.005);groups.drivetrain.add(cog); }
 tube(groups.drivetrain, [a.rearAxle[0], a.rearAxle[1] + 0.045, 0.063], [a.bottomBracket[0], a.bottomBracket[1] + 0.075, 0.063], 0.002, metal);
 tube(groups.drivetrain, [a.rearAxle[0], a.rearAxle[1] - 0.045, 0.063], [a.bottomBracket[0], a.bottomBracket[1] - 0.075, 0.063], 0.002, metal);
 box(groups.drivetrain, [0.035, spec.electronic ? 0.075 : 0.055, 0.03], [a.rearAxle[0] + 0.025, a.rearAxle[1] - 0.09, 0.06], black);
 const bar = [a.headTop[0] + 0.1, a.headTop[1] + 0.075, 0], cockpitMaterial = spec.carbonCockpit ? carbon : metal;
 tube(groups.cockpit, a.headTop, bar, 0.013, cockpitMaterial);tube(groups.cockpit, [bar[0], bar[1], -0.17], [bar[0], bar[1], 0.17], 0.012, cockpitMaterial);
 for (const sign of [-1, 1]) {
  curved(groups.cockpit, [[bar[0], bar[1], sign * 0.17], [bar[0] + 0.085, bar[1] - 0.035, sign * 0.18], [bar[0] + 0.08, bar[1] - 0.125, sign * 0.18], [bar[0] + 0.01, bar[1] - 0.125, sign * 0.18]], 0.012, black);
  box(groups.brakes, [0.035, 0.055, 0.025], [bar[0] + 0.05, bar[1] - 0.005, sign * 0.18], black);
 }
 const saddle = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10), material(spec.saddleColor));saddle.scale.set(0.14, 0.023, 0.07);saddle.position.set(...seat);saddle.position.y += 0.025;groups.saddle.add(saddle);
 return { root, groups, spec };
}

export function createViewer(element, parts, options = {}) {
 const assets = options.registry || registry;
 const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
 renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));renderer.setClearColor('#19231b');renderer.outputColorSpace = THREE.SRGBColorSpace;
 const canvas = renderer.domElement;canvas.tabIndex = 0;canvas.setAttribute('role', 'img');canvas.setAttribute('aria-describedby','viewer-help');canvas.setAttribute('aria-label', 'Schematic 3D bicycle. Arrow keys rotate; plus and minus zoom. This is not manufacturer geometry.');element.replaceChildren(canvas);
 const status = document.createElement('p');status.className = 'model-status';status.setAttribute('role', 'status');element.append(status);
 const scene = new THREE.Scene();scene.fog = new THREE.Fog('#19231b', 5, 9);
 scene.add(new THREE.HemisphereLight('#eaf7db', '#253525', 2));
 const key = new THREE.DirectionalLight('#ffffff', 3);key.position.set(2, 4, 3);scene.add(key);
 const rim = new THREE.DirectionalLight('#9fbdc7', 2);rim.position.set(-2, 2, -2);scene.add(rim);
 const floor = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.24, 0.025, 64), material('#233124', 0.05));floor.position.y = -0.018;scene.add(floor);
 const grid = new THREE.GridHelper(4, 32, '#3a4c38', '#293a2b');grid.position.y = -0.034;scene.add(grid);
 const camera = new THREE.PerspectiveCamera(38, 1, 0.02, 30);camera.position.set(1.55, 1.2, 2.6);
 const controls = new OrbitControls(camera, canvas);controls.target.set(0, 0.56, 0);controls.enablePan = false;controls.minDistance = 1.35;controls.maxDistance = 4.5;controls.maxPolarAngle = Math.PI * 0.49;
 if (options.state?.position) camera.position.fromArray(options.state.position);
 if (options.state?.target) controls.target.fromArray(options.state.target);
 let disposed = false, generation = 0, signature = '', model = null, expanded = Boolean(options.state?.expanded), ready = Promise.resolve(), problem = '', imported = [];
 const cache = new Map();
 const draw = () => { if (!disposed) renderer.render(scene, camera); };
 const resize = () => { const width = element.clientWidth, height = element.clientHeight;if (width && height) { camera.aspect = width / height;camera.updateProjectionMatrix();renderer.setSize(width, height, false);draw(); } };
 controls.addEventListener('change', draw);
 const observer = new ResizeObserver(resize);observer.observe(element);
 const onLost = event => { event.preventDefault();status.textContent = '3D context paused. Product photos remain available.'; };
 const onRestored = () => { report();draw(); };
 canvas.addEventListener('webglcontextlost', onLost);canvas.addEventListener('webglcontextrestored', onRestored);
 const snapshot = () => ({ position: camera.position.toArray(), target: controls.target.toArray(), expanded });
 function report() {
  const supplier = imported.filter(x => x.provenance === 'supplier').length, ai = imported.filter(x => x.provenance === 'ai-approximation').length;
  status.textContent = imported.length ? `Mixed 3D scene: ${supplier} supplier / ${ai} AI asset slots; remaining parts schematic. ${problem}` : `Schematic geometry only — no actual product meshes loaded. ${problem}`;
  for(const item of imported){const link=document.createElement('a');link.href=item.sourceUrl;link.target='_blank';link.rel='noopener noreferrer';link.textContent=` ${item.slot}: ${item.credit} (${item.provenance}).`;status.append(link);}
  element.dataset.provenance = imported.length ? 'mixed' : 'schematic';
  element.dispatchEvent(new CustomEvent('modelstatus', { detail: { supplier, ai, schematic: true } }));
 }
 function expand(value) {
  expanded = value;
  if (model) for (const [slot, group] of Object.entries(model.groups)) {
   const offset = value ? ({ frame: [0, 0.1, 0], wheels: [0, 0, 0.22], tires: [0, 0, 0.22], drivetrain: [0, -0.03, 0.38], brakes: [0, 0, -0.28], cockpit: [0.08, 0.16, 0], saddle: [0, 0.25, 0] })[slot] : [0, 0, 0];
   group.position.set(...offset);
  }
  element.dataset.expanded = String(value);draw();return expanded;
 }
 async function assetScene(asset) {
  if (!cache.has(asset.url)) {
   const entry = {};
   entry.promise = import('three/addons/loaders/GLTFLoader.js').then(async ({ GLTFLoader }) => {
    const loader = new GLTFLoader();const url = new URL(asset.url, document.baseURI).href;
    const response=await fetch(url);if(!response.ok)throw new Error('Model unavailable.');
    const bytes=await response.arrayBuffer();const inspection=inspectGlb(bytes);if(!inspection.valid)throw new Error(inspection.reason);
    const gltf=await loader.parseAsync(bytes,new URL('./',url).href);
    const bounds = new THREE.Box3().setFromObject(gltf.scene), size = bounds.getSize(new THREE.Vector3());
    if (bounds.isEmpty() || !Number.isFinite(size.length()) || size.length() > 4 || bounds.getCenter(new THREE.Vector3()).length() > 4) { releaseImported(gltf.scene);throw new Error('Model size requires review.'); }
    entry.scene = gltf.scene;if (disposed) releaseImported(gltf.scene);return gltf.scene;
   });
   cache.set(asset.url, entry);
  }
  return cache.get(asset.url).promise;
 }
 function update(next) {
  const nextSignature = Object.values(next).map(p => p.id).join('|');
  if (nextSignature === signature) { resize();return ready; }
  signature = nextSignature;const version = ++generation;problem = '';imported = [];
  if (model) { scene.remove(model.root);release(model.root); }
  const frameAsset = assets.assets?.[next.frame.id], frameReview = validateModelAsset(frameAsset, 'frame');
  const anchors = frameReview.valid ? frameAsset.anchors : defaultAnchors;
  model = buildSchematic(next, anchors);scene.add(model.root);
  element.dataset.frame = next.frame.id;element.dataset.wheels = next.wheels.id;element.dataset.rimDepth = String(model.spec.rimDepth);
  expand(expanded);report();
  ready = Promise.all(['frame', 'wheels'].map(async slot => {
   const asset = assets.assets?.[next[slot].id];if (!asset) return;
   const review = validateModelAsset(asset, slot);
   if (!review.valid) { problem = 'A supplied model needs metadata/alignment review; schematic retained.';report();return; }
   try {
    const loaded = await assetScene(asset);if (disposed || version !== generation) return;
    const group = model.groups[slot];for (const child of [...group.children]) { group.remove(child);release(child); }
    const positions = slot === 'wheels' ? [anchors.rearAxle, anchors.frontAxle] : [[0, 0, 0]];
    for (const position of positions) {
     const placement = new THREE.Group();placement.userData.imported = true;placement.position.set(...position);
     const object = loaded.clone(true);object.position.fromArray(asset.position || [0, 0, 0]);object.rotation.fromArray(asset.rotation || [0, 0, 0]);object.scale.fromArray(asset.scale || [1, 1, 1]);placement.add(object);group.add(placement);
    }
    imported.push({ slot, provenance: asset.provenance, credit: asset.credit, sourceUrl: asset.sourceUrl });report();draw();
   } catch { if (!disposed && version === generation) { problem = 'Product model could not load; schematic retained.';report();draw(); } }
  }));
  return ready;
 }
 function view(preset) {
  camera.position.fromArray(({ side: [0, 0.68, 3.0], front: [2.8, 0.95, 0.02], reset: [1.55, 1.2, 2.6] })[preset] || [1.55, 1.2, 2.6]);controls.target.set(0, 0.56, 0);controls.update();draw();
 }
 function zoom(factor) { const offset = camera.position.clone().sub(controls.target);offset.setLength(THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance));camera.position.copy(controls.target).add(offset);controls.update();draw(); }
 const onKey = event => {
  if (['+', '='].includes(event.key)) { event.preventDefault();zoom(0.85);return; }
  if (event.key === '-') { event.preventDefault();zoom(1.15);return; }
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
  event.preventDefault();const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
  if (event.key === 'ArrowLeft') spherical.theta += 0.12;if (event.key === 'ArrowRight') spherical.theta -= 0.12;
  if (event.key === 'ArrowUp') spherical.phi -= 0.1;if (event.key === 'ArrowDown') spherical.phi += 0.1;
  spherical.phi = THREE.MathUtils.clamp(spherical.phi, 0.1, controls.maxPolarAngle);camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));controls.update();draw();
 };
 canvas.addEventListener('keydown', onKey);controls.update();update(parts);resize();
 return { element, update, snapshot, view, zoom, expand, get ready() { return ready; },
  dispose() {
   if (disposed) return;disposed = true;generation++;observer.disconnect();controls.dispose();canvas.removeEventListener('keydown', onKey);canvas.removeEventListener('webglcontextlost', onLost);canvas.removeEventListener('webglcontextrestored', onRestored);
   if (model) release(model.root);release(floor);release(grid);
   for (const entry of cache.values()) if (entry.scene) releaseImported(entry.scene);
   renderer.dispose();renderer.forceContextLoss();element.replaceChildren();
  }
 };
}
