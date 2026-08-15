import { getBit, intToIp, MASK32, parseIp } from "./ip";
import type {
  BitRange,
  CalcInput,
  DescriptionItem,
  IpCalcResult,
  IpLine,
  NetInfo,
  SubnetEntry,
  SubnetSection,
  SupernetSection,
} from "./types";

const FALLBACK_HOST = "192.168.0.1";

const RFC = {
  rfc1918: "http://www.ietf.org/rfc/rfc1918.txt",
  rfc3330: "http://www.ietf.org/rfc/rfc3330.txt",
  rfc1700: "http://www.ietf.org/rfc/rfc1700.txt",
  rfc3171: "http://www.ietf.org/rfc/rfc3171.txt",
  rfc3021: "http://www.ietf.org/rfc/rfc3021.txt",
  rfc6598: "http://www.ietf.org/rfc/rfc6598.txt",
  rfc5737: "http://www.ietf.org/rfc/rfc5737.txt",
  rfc2544: "http://www.ietf.org/rfc/rfc2544.txt",
  rfc6890: "http://www.ietf.org/rfc/rfc6890.txt",
};

const NETBLOCKS: Array<{
  net: string;
  bits: number;
  text: string;
  url: string;
  kind: DescriptionItem["kind"];
}> = [
  { net: "192.168.0.0", bits: 16, text: "Private Internet", url: RFC.rfc1918, kind: "rfc1918" },
  { net: "172.16.0.0", bits: 12, text: "Private Internet", url: RFC.rfc1918, kind: "rfc1918" },
  { net: "10.0.0.0", bits: 8, text: "Private Internet", url: RFC.rfc1918, kind: "rfc1918" },
  { net: "169.254.0.0", bits: 16, text: "APIPA", url: RFC.rfc3330, kind: "special" },
  { net: "127.0.0.0", bits: 8, text: "Loopback", url: RFC.rfc1700, kind: "special" },
  { net: "224.0.0.0", bits: 4, text: "Multicast", url: RFC.rfc3171, kind: "special" },
  { net: "100.64.0.0", bits: 10, text: "Shared Address Space (CGNAT)", url: RFC.rfc6598, kind: "special" },
  { net: "192.0.2.0", bits: 24, text: "TEST-NET-1 (Documentation)", url: RFC.rfc5737, kind: "special" },
  { net: "198.51.100.0", bits: 24, text: "TEST-NET-2 (Documentation)", url: RFC.rfc5737, kind: "special" },
  { net: "203.0.113.0", bits: 24, text: "TEST-NET-3 (Documentation)", url: RFC.rfc5737, kind: "special" },
  { net: "192.0.0.0", bits: 24, text: "IETF Protocol Assignments", url: RFC.rfc6890, kind: "special" },
  { net: "198.18.0.0", bits: 15, text: "Benchmarking", url: RFC.rfc2544, kind: "special" },
];

export function parseNetmaskResult(
  inputRaw: string,
): { ok: true; value: number; bits: number } | { ok: false } {
  const s = inputRaw.trim();
  const cidr = s.match(/^\/?(\d{1,2})$/);
  if (cidr) {
    const bits = Number(cidr[1]);
    if (bits > 32) return { ok: false };
    return { ok: true, value: bitsToMask(bits), bits };
  }
  const raw = parseIp(s);
  if (raw === null) return { ok: false };
  const normalized = normalizeNetmask(raw);
  if (normalized === null) return { ok: false };
  return { ok: true, value: normalized, bits: bitcount(normalized) };
}

/** Count leading ones of a 32-bit mask (0..32). */
export function bitcount(mask: number): number {
  let bits = 0;
  while (bits < 32 && getBit(mask >>> 0, bits + 1) === 1) bits++;
  return bits;
}

function normalizeNetmask(raw: number): number | null {
  let mask = raw >>> 0;
  if ((mask >>> 31) === 0) mask = (~mask) >>> 0;
  let sawZero = false;
  for (let j = 1; j <= 32; j++) {
    if (getBit(mask, j) === 0) sawZero = true;
    else if (sawZero) return null;
  }
  return mask;
}

function bitsToMask(bits: number): number {
  let n = 0;
  for (let j = 0; j < bits; j++) n = (n | (1 << (31 - j))) >>> 0;
  return n >>> 0;
}

/** Class A/B/C/D/E of an address (mirrors ipcalc's getclass). */
export function classOf(n: number): string {
  const u = n >>> 0;
  for (let c = 1; c <= 5; c++) {
    if (getBit(u, c) === 0) return String.fromCharCode(64 + c);
  }
  return "invalid";
}

export function naturalMaskBits(ip: number): number {
  const classMap: Record<string, number> = { A: 8, B: 16, C: 24, D: 4, E: 5 };
  return classMap[classOf(ip)] ?? 24;
}

function classRangeOf(network: number): BitRange | null {
  const u = network >>> 0;
  const limit = naturalMaskBits(u);
  let j = 1;
  while (j <= 32 && getBit(u, j) === 1) j++;
  const end = Math.min(j - 1, limit);
  if (end < 1) return null;
  return { start: 1, end, color: "class" };
}

function netblock(
  networkStart: number,
  myMask: number,
): { text: string; url: string; kind: DescriptionItem["kind"] } | null {
  const myEnd = (networkStart | ((~myMask) & MASK32)) >>> 0;
  for (const block of NETBLOCKS) {
    const start = parseIp(block.net)!;
    const end = (start + (1 << (32 - block.bits)) - 1) >>> 0;
    let match = 0;
    if (networkStart >= start && networkStart <= end) match++;
    if (myEnd >= start && myEnd <= end) match++;
    if (start > networkStart && end < myEnd) match = 1;
    if (match === 1) return { text: `In Part ${block.text}`, url: block.url, kind: block.kind };
    if (match === 2) return { text: block.text, url: block.url, kind: block.kind };
  }
  return null;
}

function describeNetwork(
  network: number,
  mask: number,
): { items: DescriptionItem[]; text: string } {
  const items: DescriptionItem[] = [];
  items.push({ label: `Class ${classOf(network)}`, kind: "class" });
  const nb = netblock(network, mask);
  if (nb) items.push({ label: nb.text, url: nb.url, kind: nb.kind });
  if (bitcount(mask) === 31) items.push({ label: "PtP Link RFC 3021", url: RFC.rfc3021, kind: "ptp" });
  return { items, text: items.map((i) => i.label).join(", ") };
}

interface BuildNetLinesOptions {
  /** Range highlighting the new subnet bits (old + 1 .. new). */
  subnetRange?: BitRange;
}

function buildNetLines(
  network: number,
  mask: number,
  options: BuildNetLinesOptions = {},
): NetInfo {
  const bits = bitcount(mask);
  const broadcast = (network | ((~mask) & MASK32)) >>> 0;
  let hmin = (network + 1) >>> 0;
  let hmax = (broadcast - 1) >>> 0;
  let hostsPerNet = hmax - hmin + 1;
  if (bits === 31) {
    hmin = network;
    hmax = broadcast;
    hostsPerNet = 2;
  }
  if (bits === 32) hostsPerNet = 1;

  const lines: IpLine[] = [];

  const makeRanges = (): BitRange[] | undefined => {
    const ranges: BitRange[] = [];
    const cls = classRangeOf(network);
    if (cls) ranges.push(cls);
    if (options.subnetRange) ranges.push(options.subnetRange);
    return ranges.length > 0 ? ranges : undefined;
  };

  if (bits === 32) {
    lines.push({
      label: "Hostroute",
      value: network,
      extra: `/${bits}`,
      maskBits: bits,
      highlightClass: true,
      ranges: makeRanges(),
    });
  } else {
    lines.push({
      label: "Network",
      value: network,
      extra: `/${bits}`,
      maskBits: bits,
      highlightClass: true,
      ranges: makeRanges(),
    });
    lines.push({ label: "HostMin", value: hmin, maskBits: bits, ranges: makeRanges() });
    lines.push({ label: "HostMax", value: hmax, maskBits: bits, ranges: makeRanges() });
    if (bits < 31) {
      lines.push({ label: "Broadcast", value: broadcast, maskBits: bits, ranges: makeRanges() });
    }
  }

  const { items, text } = describeNetwork(network, mask);
  return { lines, hostsPerNet, descriptionItems: items, description: text };
}

function buildSubnetEntry(number: number, net: number, mask: number, subnetRange: BitRange): SubnetEntry {
  return { number, ...buildNetLines(net, mask, { subnetRange }) };
}

export function calculateIpCalc(input: CalcInput): IpCalcResult {
  const errors: string[] = [];
  let usedFallbacks = false;

  const hostStr = input.host.replace(/\s+/g, "");
  const mask1Str = input.mask1.replace(/\s+/g, "");
  const mask2Str = input.mask2.replace(/\s+/g, "");

  let addressStr = hostStr;
  if (addressStr === "") {
    errors.push("No host given");
    usedFallbacks = true;
    addressStr = FALLBACK_HOST;
  }
  if (!/^\d+$/.test(addressStr.replace(/\./g, ""))) {
    errors.push(`Illegal value for host ('${addressStr}')`);
    usedFallbacks = true;
    addressStr = FALLBACK_HOST;
  }
  let address = parseIp(addressStr);
  if (address === null) {
    errors.push(`INVALID ADDRESS: ${addressStr}`);
    usedFallbacks = true;
    address = parseIp(FALLBACK_HOST)!;
  }

  let mask1Input = mask1Str;
  if (mask1Input === "") {
    errors.push("No netmask given (using default netmask of your network's class)");
    usedFallbacks = true;
    mask1Input = String(naturalMaskBits(address));
  }
  if (!/^\d+$/.test(mask1Input.replace(/\./g, ""))) {
    errors.push(`Illegal value for netmask ('${mask1Input}')`);
    usedFallbacks = true;
    mask1Input = "24";
  }
  let mask1 = parseNetmaskResult(mask1Input);
  if (!mask1.ok) {
    errors.push(`Illegal value for netmask ('${mask1Input}')`);
    usedFallbacks = true;
    mask1 = parseNetmaskResult("24");
  }
  const mask1Value = mask1.ok ? mask1.value : bitsToMask(24);
  const mask1Bits = mask1.ok ? mask1.bits : 24;

  let mask2Value: number | null = null;
  let mask2Bits: number | null = null;
  if (mask2Str !== "") {
    if (!/^\d+$/.test(mask2Str.replace(/\./g, ""))) {
      errors.push(`Illegal value for netmask for sub/supernet ('${mask2Str}')`);
      usedFallbacks = true;
    } else {
      const mask2 = parseNetmaskResult(mask2Str);
      if (!mask2.ok) {
        errors.push(`Illegal value for netmask for sub/supernet ('${mask2Str}')`);
        usedFallbacks = true;
      } else {
        mask2Value = mask2.value;
        mask2Bits = mask2.bits;
      }
    }
  }
  if (mask2Value !== null && mask2Value === mask1Value) {
    mask2Value = null;
    mask2Bits = null;
  }

  const network = (address & mask1Value) >>> 0;
  const wildcard = (~mask1Value) >>> 0;

  const lines: IpLine[] = [
    { label: "Address", value: address, maskBits: mask1Bits },
    { label: "Netmask", value: mask1Value, extra: ` = ${mask1Bits}`, maskBits: mask1Bits, maskColor: true },
    { label: "Wildcard", value: wildcard, maskBits: mask1Bits },
  ];

  const netInfo = buildNetLines(network, mask1Value);
  lines.push(...netInfo.lines);

  netInfo.lines = lines;

  let subnetSection: SubnetSection | null = null;
  let supernetSection: SupernetSection | null = null;

  if (mask2Value !== null && mask2Bits !== null) {
    if (mask2Bits > mask1Bits) {
      const heading = `Subnets after transition from /${mask1Bits} to /${mask2Bits}`;
      const netmaskLines: IpLine[] = [
        {
          label: "Netmask",
          value: mask2Value,
          extra: ` = ${mask2Bits}`,
          maskBits: mask2Bits,
          maskColor: true,
        },
        { label: "Wildcard", value: (~mask2Value) >>> 0, maskBits: mask2Bits },
      ];
      const count = 1 << (mask2Bits - mask1Bits);
      const DISPLAY_CAP = 100;
      const truncated = count > DISPLAY_CAP;
      const subnetRange: BitRange = { start: mask1Bits + 1, end: mask2Bits, color: "subnet" };
      const entries: SubnetEntry[] = [];
      for (let k = 0; k < Math.min(count, DISPLAY_CAP); k++) {
        const net = (network | (k << (32 - mask2Bits))) >>> 0;
        entries.push(buildSubnetEntry(k + 1, net, mask2Value, subnetRange));
      }
      const wildcard2 = (~mask2Value) & MASK32;
      let perSubnetHosts = ((network | wildcard2) >>> 0) - network - 1;
      if (perSubnetHosts < 1) perSubnetHosts = 1;
      subnetSection = {
        heading,
        netmaskLines,
        entries,
        subnetsTotal: count,
        hostsTotal: perSubnetHosts * count,
        truncated,
      };
    } else if (mask2Bits < mask1Bits) {
      const superNetwork = (network & mask2Value) >>> 0;
      const netmaskLines: IpLine[] = [
        {
          label: "Netmask",
          value: mask2Value,
          extra: ` = ${mask2Bits}`,
          maskBits: mask2Bits,
          maskColor: true,
        },
        { label: "Wildcard", value: (~mask2Value) >>> 0, maskBits: mask2Bits },
      ];
      supernetSection = {
        heading: "Supernet",
        netmaskLines,
        ...buildNetLines(superNetwork, mask2Value),
      };
    }
  }

  return {
    errors,
    usedFallbacks,
    address,
    mask1Bits,
    mask2Bits,
    netInfo,
    subnetSection,
    supernetSection,
  };
}

export function lineToDotted(line: IpLine): string {
  return `${intToIp(line.value)}${line.extra ?? ""}`;
}