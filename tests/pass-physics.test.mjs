import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = ts.transpileModule(readFileSync(new URL("../lib/world/pass-physics.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { stepPassBody } = await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));
const mass = (values = {}) => ({ x: 0, y: 0, vx: 0, vy: 0, angle: 0, angularVelocity: 0, ...values });

test("the pass drops from above, catches on the strap and settles", () => {
  const body = mass({ x: -24, y: -800, vx: 65, angle: -9 });
  let lowest = -Infinity;
  for (let i = 0; i < 1200; i++) {
    stepPassBody(body, 180, 1 / 60);
    lowest = Math.max(lowest, body.y);
    assert.ok(Object.values(body).every(Number.isFinite));
  }
  assert.ok(lowest > 10 && lowest < 160, `strap catch: ${lowest}`);
  assert.ok(Math.abs(body.x) < 0.1 && Math.abs(body.y) < 0.1);
});

test("a released pass swings back and loses energy at different frame rates", () => {
  for (const rate of [30, 60, 120]) {
    const body = mass({ x: 130, y: -45, vx: 600, vy: 100, angle: -16 });
    let crossed = false;
    for (let i = 0; i < rate * 20; i++) {
      stepPassBody(body, 160, 1 / rate);
      crossed ||= body.x < -5;
    }
    assert.ok(crossed, "release should retain swing momentum");
    assert.ok(Math.hypot(body.x, body.y, body.vx, body.vy) < 0.2);
  }
});

test("a paused frame cannot create an unbounded physics jump", () => {
  const body = mass({ x: 70, y: -20, vx: 300 });
  stepPassBody(body, 65, 60);
  assert.ok(Object.values(body).every(Number.isFinite));
  assert.ok(Math.abs(body.x) < 100 && Math.abs(body.y) < 100);
});
