export type PassBody = {
  x: number; y: number; vx: number; vy: number;
  angle: number; angularVelocity: number;
};

/** A hanging mass on a damped, elastic tether. Coordinates are CSS pixels. */
export function stepPassBody(body: PassBody, length: number, elapsed: number) {
  const steps = Math.ceil(Math.min(elapsed, 0.05) / (1 / 120));
  const dt = Math.min(elapsed, 0.05) / Math.max(1, steps);
  for (let i = 0; i < steps; i++) {
    const down = length + body.y;
    const distance = Math.max(1, Math.hypot(body.x, down));
    const radialSpeed = (body.x * body.vx + down * body.vy) / distance;
    // Above the anchor the pass is still dropping in; the strap has not caught it.
    const tension = down > 0
      ? Math.max(0, (distance - length + 2200 / 180) * 180 + radialSpeed * 13)
      : 0;
    body.vx += (-tension * body.x / distance - body.vx * 1.8) * dt;
    body.vy += (2200 - tension * down / distance - body.vy * 1.8) * dt;
    body.x += body.vx * dt;
    body.y += body.vy * dt;
    const lean = -Math.atan2(body.x, Math.max(60, down)) * 180 / Math.PI * 0.65;
    body.angularVelocity += ((lean - body.angle) * 95 - body.angularVelocity * 9) * dt;
    body.angle += body.angularVelocity * dt;
  }
  return Math.abs(body.x) + Math.abs(body.y) + Math.abs(body.vx) +
    Math.abs(body.vy) + Math.abs(body.angle) + Math.abs(body.angularVelocity) < 0.12;
}
