export const MASK32 = 0xffffffff;

/** Convert four octets (0..255) into an unsigned 32-bit integer. */
export function ipToInt(octets: readonly number[]): number {
  let n = 0;
  for (const o of octets) {
    n = ((n << 8) | (o & 0xff)) >>> 0;
  }
  return n >>> 0;
}

/** Convert an unsigned 32-bit integer into a dotted-quad string. */
export function intToIp(n: number): string {
  const u = n >>> 0;
  return `${(u >>> 24) & 0xff}.${(u >>> 16) & 0xff}.${(u >>> 8) & 0xff}.${u & 0xff}`;
}

/** Bit j is 1-based, MSB first (j=1 is the most significant bit). */
export function getBit(n: number, j: number): number {
  return (n >>> (32 - j)) & 1;
}

/** Parse a strict dotted-quad IPv4 address. Returns null if invalid. */
export function parseIp(s: string): number | null {
  const m = s.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const octets = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
  if (octets.some((o) => o > 255)) return null;
  return ipToInt(octets);
}

/** Render an unsigned 32-bit integer as a 32-char binary string. */
export function toBinary32(n: number): string {
  const u = n >>> 0;
  let out = "";
  for (let j = 1; j <= 32; j++) out += getBit(u, j) === 1 ? "1" : "0";
  return out;
}