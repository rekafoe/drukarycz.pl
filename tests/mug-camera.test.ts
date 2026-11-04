import assert from "node:assert/strict";
import test from "node:test";
import { mugPrintCenterAngle, mugWrapArcFromHandle } from "../components/souvenir3d/scale.ts";

test("середина обёртки кружки смотрит напротив ручки, не в начало зоны", () => {
  const arc = mugWrapArcFromHandle({ widthMm: 200 });
  const face = mugPrintCenterAngle({ widthMm: 200 });
  const startX = Math.sin(arc.thetaStart);
  const startZ = Math.cos(arc.thetaStart);
  assert.ok(Math.abs(face.theta - (arc.thetaStart + arc.thetaLength / 2)) < 1e-9);
  const towardStart = face.x * startX + face.z * startZ;
  assert.ok(towardStart < 0.2);
  assert.ok(face.x < -0.9);
  assert.ok(Math.abs(face.z) < 0.15);
});
