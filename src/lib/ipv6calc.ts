import {
  IPV6_FULL,
  IPV6_MAX_BITS,
  ipv6ToExpanded,
  ipv6ToString,
  lastAddressOf,
  networkOf,
  parseIPv6,
  prefixMask,
} from "./ipv6";
import type { DescriptionItem, Ipv6CalcResult, Ipv6Line, Ipv6NetInfo } from "./types";

const RFC = {
  rfc4291: "https://datatracker.ietf.org/doc/html/rfc4291",
  rfc4193: "https://datatracker.ietf.org/doc/html/rfc4193",
  rfc6052: "https://datatracker.ietf.org/doc/html/rfc6052",
  rfc3849: "https://datatracker.ietf.org/doc/html/rfc3849",
};

const FE80_START = parseIPv6("fe80::")!;
const FE80_END = parseIPv6("febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff")!;
const MCAST_START = parseIPv6("ff00::")!;
const ULA_START = parseIPv6("fc00::")!;
const ULA_END = parseIPv6("fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff")!;
const DOC_START = parseIPv6("2001:db8::")!;
const DOC_END = parseIPv6("2001:db8:ffff:ffff:ffff:ffff:ffff:ffff")!;

function describeIpv6(addr: bigint, prefix: number): DescriptionItem[] {
  const items: DescriptionItem[] = [];
  if (prefix === 128 && addr === 0n) items.push({ label: "Unspecified", url: RFC.rfc4291, kind: "special" });
  if (prefix === 128 && addr === 1n) items.push({ label: "Loopback", url: RFC.rfc4291, kind: "special" });
  if (addr >= FE80_START && addr <= FE80_END) items.push({ label: "Link-Local", url: RFC.rfc4291, kind: "special" });
  if (addr >= MCAST_START) items.push({ label: "Multicast", url: RFC.rfc4291, kind: "special" });
  if (addr >= ULA_START && addr <= ULA_END) items.push({ label: "Unique Local (ULA)", url: RFC.rfc4193, kind: "special" });
  if (addr >= DOC_START && addr <= DOC_END) items.push({ label: "Documentation", url: RFC.rfc3849, kind: "special" });
  if ((addr >> 48n) === 0n && (addr & 0xffff00000000n) === 0xffff00000000n) {
    items.push({ label: "IPv4-mapped", url: RFC.rfc6052, kind: "special" });
  }
  return items;
}

export function calculateIpv6Calc(input: { host: string; prefixStr: string }): Ipv6CalcResult {
  const errors: string[] = [];
  const hostTrimmed = input.host.trim();

  let address = parseIPv6(input.host);
  if (hostTrimmed === "") {
    errors.push("No host given");
    address = 0n;
  } else if (address === null) {
    errors.push(`INVALID ADDRESS: ${hostTrimmed}`);
    address = 0n;
  }

  const prefixStr = input.prefixStr.replace(/\s+/g, "");
  let prefix: number;
  if (prefixStr === "") {
    errors.push("No prefix given (using default /64)");
    prefix = 64;
  } else if (/^\d{1,3}$/.test(prefixStr) && Number(prefixStr) <= IPV6_MAX_BITS) {
    prefix = Number(prefixStr);
  } else {
    errors.push(`Illegal value for prefix ('${prefixStr}')`);
    prefix = 64;
  }

  const network = networkOf(address, prefix);
  const last = lastAddressOf(address, prefix);

  const lines: Ipv6Line[] = [
    { label: "Address", value: ipv6ToString(address) },
    { label: "Expanded", value: ipv6ToExpanded(address) },
    { label: "Netmask", value: ipv6ToExpanded(prefixMask(prefix)), extra: ` = ${prefix}` },
    { label: "Wildcard", value: ipv6ToExpanded((~prefixMask(prefix)) & IPV6_FULL) },
    { label: "Network", value: ipv6ToString(network), extra: `/${prefix}` },
    { label: "First", value: ipv6ToString(network) },
    { label: "Last", value: ipv6ToString(last) },
  ];

  const exponent = 128 - prefix;
  let addressesPerNet: string;
  if (exponent <= 30) {
    addressesPerNet = (1n << BigInt(exponent)).toLocaleString("es");
  } else if (exponent <= 60) {
    addressesPerNet = `${(1n << BigInt(exponent)).toLocaleString("es")} (2^${exponent})`;
  } else {
    addressesPerNet = `2^${exponent}`;
  }

  const netInfo: Ipv6NetInfo = {
    lines,
    addressesPerNet,
    descriptionItems: describeIpv6(address, prefix),
  };

  return {
    errors,
    address,
    expanded: ipv6ToExpanded(address),
    compressed: ipv6ToString(address),
    prefix,
    netInfo,
  };
}