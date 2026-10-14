// Scene dimensions below are illustrative metres, not manufacturer measurements.
export const defaultAnchors = {
 rearAxle: [-0.54, 0.35, 0], frontAxle: [0.51, 0.35, 0],
 bottomBracket: [-0.12, 0.29, 0], seatTop: [-0.25, 0.85, 0],
 headTop: [0.32, 0.86, 0], headBottom: [0.37, 0.72, 0]
};
export function schematicSpec(parts) {
 return {
  frameColor: ({ 'allez-sprint': '#4d83a6', 'tarmac-sl8-10r': '#97505a', 'tarmac-sl8': '#acb5a1' })[parts.frame.id] || '#acb5a1',
  tubeRadius: parts.frame.id === 'allez-sprint' ? 0.017 : 0.022,
  rimDepth: parts.wheels.id === 'rd38' ? 0.045 : 0.022,
  tireRadius: parts.tires.width >= 32 ? 0.017 : 0.013,
  carbonCockpit: parts.cockpit.id === 'pro-plt-carbon',
  electronic: parts.drivetrain.controlSystem === 'di2-12',
  saddleColor: parts.saddle.id === 'power-expert' ? '#333c35' : '#1c2520'
 };
}
const triple = (value, limit = 10) => Array.isArray(value) && value.length === 3 && value.every(n => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) <= limit);
export function validateModelAsset(asset, slot) {
 if (!asset || typeof asset !== 'object') return { valid: false, reason: 'No product model supplied.' };
 if (!['frame', 'wheels'].includes(slot) || asset.slot !== slot) return { valid: false, reason: 'Model slot does not match.' };
 if (typeof asset.url !== 'string' || !/^models\/[a-zA-Z0-9/_-]+\.glb$/.test(asset.url) || asset.url.includes('..')) return { valid: false, reason: 'Use a local models/*.glb file.' };
 if (!['supplier', 'ai-approximation'].includes(asset.provenance)) return { valid: false, reason: 'Declare model provenance.' };
 if (!asset.credit || typeof asset.credit !== 'string' || !asset.usageBasis || typeof asset.usageBasis !== 'string') return { valid: false, reason: 'Model credit and usage basis are required.' };
 try { if (new URL(asset.sourceUrl).protocol !== 'https:') throw new Error(); } catch { return { valid: false, reason: 'Supply an HTTPS evidence/source URL.' }; }
 if (asset.units !== 'metres' || asset.alignmentReviewed !== true) return { valid: false, reason: 'Metre units and alignment need review.' };
 if (!triple(asset.position || [0, 0, 0]) || !triple(asset.rotation || [0, 0, 0]) || !triple(asset.scale || [1, 1, 1]) || (asset.scale || [1, 1, 1]).some(n => n <= 0)) return { valid: false, reason: 'Invalid model transform.' };
 if (slot === 'frame' && (!asset.anchors || Object.keys(defaultAnchors).some(key => !triple(asset.anchors[key], 3)))) return { valid: false, reason: 'A frame needs all six reviewed assembly anchors.' };
 if (slot === 'wheels' && asset.layout !== 'single-wheel') return { valid: false, reason: 'Export one wheel centred on its hub, axle along Z.' };
 return { valid: true };
}

export function inspectGlb(buffer) {
 try {
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : ArrayBuffer.isView(buffer) ? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) : null;
  if (!bytes || bytes.byteLength < 20 || bytes.byteLength > 10 * 1024 * 1024) throw new Error();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2 || view.getUint32(8, true) !== bytes.byteLength) throw new Error();
  const jsonLength = view.getUint32(12, true);
  if (view.getUint32(16, true) !== 0x4e4f534a || jsonLength + 20 > bytes.byteLength) throw new Error();
  const data = JSON.parse(new TextDecoder().decode(bytes.subarray(20, 20 + jsonLength)));
  if (data.asset?.version !== '2.0') throw new Error();
  if ([...(data.buffers || []), ...(data.images || [])].some(resource => resource.uri !== undefined)) return { valid: false, reason: 'Embed buffers and textures in the GLB.' };
  if ((data.extensionsRequired || []).some(name => ['KHR_draco_mesh_compression', 'EXT_meshopt_compression'].includes(name))) return { valid: false, reason: 'This viewer requires an uncompressed GLB.' };
  if (data.skins?.length || data.animations?.length) return { valid: false, reason: 'Supply a static mesh without skeletons or animation.' };
  return { valid: true };
 } catch { return { valid: false, reason: 'Supply a valid GLB 2.0 under 10 MB.' }; }
}
