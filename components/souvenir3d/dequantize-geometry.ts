import * as THREE from "three";

/**
 * KHR_mesh_quantization хранит вершины как int16 с normalized.
 * toNonIndexed и clone флаг сохраняют, но applyMatrix4 читает float
 * и пишет его обратно через normalize() в int16. Координаты студии
 * (~±1…2) туда не влезают и переполняются. Код печати потом читает
 * сырой array, поэтому принт оказывается в диапазоне ±32767, а не на ткани.
 * Разворачиваем атрибуты в Float32 до любых матриц.
 */
export function dequantizeGeometry(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  const expanded = geometry.index ? geometry.toNonIndexed() : geometry;
  const geo = new THREE.BufferGeometry();
  for (const name of Object.keys(expanded.attributes)) {
    const attr = expanded.getAttribute(name) as THREE.BufferAttribute;
    const out = new Float32Array(attr.count * attr.itemSize);
    for (let i = 0; i < attr.count; i += 1) {
      for (let k = 0; k < attr.itemSize; k += 1) {
        out[i * attr.itemSize + k] = attr.getComponent(i, k);
      }
    }
    geo.setAttribute(name, new THREE.BufferAttribute(out, attr.itemSize, false));
  }
  if (expanded !== geometry) expanded.dispose();
  return geo;
}
