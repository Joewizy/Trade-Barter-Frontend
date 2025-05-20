export function toBaseUnits(suiAmount: number): number {
  return Math.floor(suiAmount * 1e9); // Convert 0.1 → 100_000_000
}

export function fromBaseUnits(baseAmount: number): number {
  return baseAmount / 1e9;
}
