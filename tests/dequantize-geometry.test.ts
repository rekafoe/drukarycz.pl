import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { dequantizeGeometry } from "../components/souvenir3d/dequantize-geometry.ts";

test("int16 normalized разворачивается в float и переживает масштаб студии", () => {
  const raw = new Int16Array([
    0, 0, 0,
    32767, 0, 0,
    0, 32767, 0,
  ]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(raw, 3, true));
  geometry.setIndex([0, 1, 2]);

  const broken = geometry.clone();
  const mesh = new THREE.Mesh(broken);
  mesh.scale.setScalar(2);
  mesh.updateWorldMatrix(true, true);
  broken.applyMatrix4(mesh.matrixWorld);
  const overflow = broken.getAttribute("position").array[0];
  assert.ok(Math.abs(overflow - 2) > 0.5);

  const geo = dequantizeGeometry(geometry);
  const pos = geo.getAttribute("position");
  assert.equal(pos.array.constructor, Float32Array);
  assert.equal(pos.normalized, false);
  assert.ok(Math.abs(pos.getX(1) - 1) < 1e-4);
  geo.applyMatrix4(mesh.matrixWorld);
  const fitted = geo.getAttribute("position").array as Float32Array;
  assert.ok(Math.abs(fitted[3] - 2) < 1e-3);
  assert.ok(Math.abs(fitted[3]) < 10);
});
