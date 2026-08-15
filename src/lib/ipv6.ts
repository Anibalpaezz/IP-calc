import { parseIp } from "./ip";

export const IPV6_MAX_BITS = 128;

export const IPV6_FULL = (1n << 128n) - 1n;

/** Parse a single hex group (1..4 hex digits). Returns -1 if invalid. */
function parseHextet(g: string): number {
  if (!/^[0-9a-fA-F]{1,4}$/.test(g)) return -1;
  return Number.parseInt(g, 16);
}

/**
 * Parse a full IPv6 address (without prefix) into an unsigned 128-bit BigInt.
 * Supports `::` compression and embedded IPv4 tails (e.g. `::ffff:192.168.1.1`).
 * Returns null if invalid.
 */
export function parseIPv6(input: string): bigint | null {
  let s = input.trim();
  if (s === "") return null;

  let ipv4Tail: number | null = null;
  const v4Match = s.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (v4Match) {
    const v4 = parseIp(v4Match[0]);
    if (v4 === null) return null;
    ipv4Tail = v4;
    s = s.slice(0, s.length - v4Match[0].length);
    // Drop the single group separator before the embedded IPv4, keeping the
    // `::` compression marker untouched.
    if (!s.endsWith("::") && s.endsWith(":")) s = s.slice(0, -1);
  }

  const hasDoubleColon = s.includes("::");
  if (!hasDoubleColon) {
    const groups = s.split(":").map(parseHextet);
    if (groups.length !== 8 || groups.some((n) => n < 0)) return null;
    return buildValue(groups, ipv4Tail);
  }
  const all = s.split("::");
  if (all.length !== 2) return null;
  const [left, right] = all;
  const lg = (left === "" ? [] : left.split(":")).map(parseHextet);
  const rg = (right === "" ? [] : right.split(":")).map(parseHextet);
  if (lg.some((n) => n < 0) || rg.some((n) => n < 0)) return null;
  if (lg.length + rg.length > 8) return null;
  const hexCount = lg.length + rg.length;
  if ((ipv4Tail === null ? 0 : 2) + hexCount > 8) return null;
  const zeros = 8 - hexCount - (ipv4Tail === null ? 0 : 2);
  return buildValue([...lg, ...new Array<number>(zeros).fill(0), ...rg], ipv4Tail);
}

function buildValue(hextets: readonly number[], ipv4Tail: number | null): bigint {
  const full: number[] = [...hextets];
  if (ipv4Tail !== null) {
    full.push((ipv4Tail >>> 16) & 0xffff);
    full.push(ipv4Tail & 0xffff);
  }
  let n = 0n;
  for (const h of full) n = (n << 16n) | BigInt(h);
  return n;
}

/** Split a 128-bit value into its 8 hex groups (MSB first). */
export function ipv6Groups(n: bigint): number[] {
  const groups: number[] = [];
  let x = (n & IPV6_FULL) >> 0n;
  for (let i = 0; i < 8; i++) {
    groups.unshift(Number(x & 0xffffn));
    x >>= 16n;
  }
  return groups;
}

/** Render a 128-bit value in RFC 5952 compressed form (e.g. `2001:db8::1`). */
export function ipv6ToString(n: bigint): string {
  const g = ipv6Groups(n);
  let bestStart = -1;
  let bestLen = 0;
  let runStart = -1;
  for (let i = 0; i <= 8; i++) {
    if (i < 8 && g[i] === 0) {
      if (runStart === -1) runStart = i;
    } else if (runStart !== -1) {
      const len = i - runStart;
      if (len > bestLen) {
        bestLen = len;
        bestStart = runStart;
      }
      runStart = -1;
    }
  }
  if (bestLen >= 2) {
    const before = g.slice(0, bestStart).map((h) => h.toString(16)).join(":");
    const after = g.slice(bestStart + bestLen).map((h) => h.toString(16)).join(":");
    return `${before}::${after}`;
  }
  return g.map((h) => h.toString(16)).join(":");
}

/** Render a 128-bit value fully expanded, 4 hex digits per group. */
export function ipv6ToExpanded(n: bigint): string {
  return ipv6Groups(n)
    .map((h) => h.toString(16).padStart(4, "0"))
    .join(":");
}

/** Netmask for a prefix length (0..128). */
export function prefixMask(prefix: number): bigint {
  if (prefix <= 0) return 0n;
  if (prefix >= IPV6_MAX_BITS) return IPV6_FULL;
  return IPV6_FULL ^ ((1n << BigInt(IPV6_MAX_BITS - prefix)) - 1n);
}

/** First (network) address for an address and prefix. */
export function networkOf(addr: bigint, prefix: number): bigint {
  return (addr & prefixMask(prefix)) & IPV6_FULL;
}

/** Last address in the block for an address and prefix. */
export function lastAddressOf(addr: bigint, prefix: number): bigint {
  return (addr | ~prefixMask(prefix)) & IPV6_FULL;
}

/** Number of addresses in a block of the given prefix. */
export function addressCount(prefix: number): bigint {
  return 1n << BigInt(IPV6_MAX_BITS - prefix);
}