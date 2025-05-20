export function toBaseUnits(suiAmount: number): number {
  return Math.floor(suiAmount * 1e9); // Convert 0.1 → 100_000_000
}

export function fromBaseUnits(baseAmount: number): number {
  return baseAmount / 1e9;
}

export function formatSecondsToDDMMYY(secs: number): string {
  const date = new Date(secs * 1000);

  const dd = String(date.getUTCDate()).padStart(2, '0');
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0'); 
  const yy = String(date.getUTCFullYear()).slice(-2);

  return `${dd}/${mm}/${yy}`;
}
