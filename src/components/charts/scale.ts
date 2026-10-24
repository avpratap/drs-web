/** "Nice" axis maximum and ticks (0 … max) for a value range. */
export function niceTicks(max: number, count = 4): number[] {
  if (!(max > 0)) return [0, 1];
  const rough = max / count;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= rough) ?? rough;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(+v.toFixed(10));
  return ticks;
}

/** 0 / 950 / 1.2K / 12K / 1.5L / 2.3Cr — Indian compact notation for axis ticks. */
export function compactINR(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e7) return `${+(n / 1e7).toFixed(1)}Cr`;
  if (abs >= 1e5) return `${+(n / 1e5).toFixed(1)}L`;
  if (abs >= 1e3) return `${+(n / 1e3).toFixed(1)}K`;
  return `${+n.toFixed(0)}`;
}
