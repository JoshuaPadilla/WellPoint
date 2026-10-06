export type AccessState = 'served' | 'partial' | 'underserved';

export type AccessInput = {
  available: boolean;
  flow: number;
  quality: 'safe' | 'advisory' | 'unsafe';
} | null;

export function accessState(
  affordability: number,
  status: AccessInput,
): AccessState {
  if (!status || !status.available) return 'underserved';
  if (status.quality === 'unsafe') return 'underserved';
  if (status.flow >= 40 && status.quality === 'safe' && affordability >= 40)
    return 'served';
  if (status.flow >= 25) return 'partial';
  return 'underserved';
}
