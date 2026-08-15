import { describe, expect, it } from "vitest";
import {
  ipv6ToExpanded,
  ipv6ToString,
  lastAddressOf,
  networkOf,
  parseIPv6,
  prefixMask,
} from "./ipv6";
import { calculateIpv6Calc } from "./ipv6calc";
import { ipv6ToText } from "./export";

describe("parseIPv6", () => {
  it("parses zero and loopback", () => {
    expect(parseIPv6("::")).toBe(0n);
    expect(parseIPv6("::1")).toBe(1n);
  });

  it("parses a full and a compressed address", () => {
    const expected = (0x2001n << 112n) | (0x0db8n << 96n) | 1n;
    expect(parseIPv6("2001:db8::1")).toBe(expected);
    expect(parseIPv6("2001:0db8:0000:0000:0000:0000:0000:0001")).toBe(expected);
  });

  it("parses embedded IPv4", () => {
    const v4 = (0xc0n << 24n) | (0xa8n << 16n) | 1n; // 192.168.0.1
    expect(parseIPv6("::ffff:192.168.0.1")).toBe((0xffffn << 32n) | v4);
    expect(parseIPv6("64:ff9b::1.2.3.4")).not.toBeNull();
  });

  it("rejects invalid addresses", () => {
    expect(parseIPv6("")).toBeNull();
    expect(parseIPv6("1:2:3:4:5:6:7")).toBeNull();
    expect(parseIPv6("12345::")).toBeNull();
    expect(parseIPv6("2001:db8::1::1")).toBeNull();
    expect(parseIPv6("gg::1")).toBeNull();
    expect(parseIPv6("1:2:3:4:5:6:7:8:9")).toBeNull();
    expect(parseIPv6("::ffff:999.1.1.1")).toBeNull();
  });
});

describe("ipv6ToString / ipv6ToExpanded", () => {
  it("compresses per RFC 5952", () => {
    expect(ipv6ToString(0n)).toBe("::");
    expect(ipv6ToString(1n)).toBe("::1");
    expect(ipv6ToString(parseIPv6("fe80:0:0:0:1:2:3:4")!)).toBe("fe80::1:2:3:4");
  });

  it("expands to 4-digit groups", () => {
    const a = parseIPv6("2001:db8::1")!;
    expect(ipv6ToExpanded(a)).toBe("2001:0db8:0000:0000:0000:0000:0000:0001");
  });

  it("prefers the leftmost longest zero run", () => {
    expect(ipv6ToString(parseIPv6("1:0:0:0:0:2:0:3")!)).toBe("1::2:0:3");
  });
});

describe("network math", () => {
  it("computes network and last address for /64", () => {
    const a = parseIPv6("2001:db8::1")!;
    expect(ipv6ToString(networkOf(a, 64))).toBe("2001:db8::");
    expect(ipv6ToString(lastAddressOf(a, 64))).toBe("2001:db8::ffff:ffff:ffff:ffff");
    expect(prefixMask(64)).toBe(parseIPv6("ffff:ffff:ffff:ffff::")!);
  });

  it("handles /128 and /127", () => {
    const a = parseIPv6("2001:db8::1")!;
    expect(networkOf(a, 128)).toBe(a);
    expect(lastAddressOf(a, 128)).toBe(a);
    expect(ipv6ToString(lastAddressOf(a, 127))).toBe("2001:db8::1");
  });
});

describe("calculateIpv6Calc", () => {
  it("computes a full result", () => {
    const r = calculateIpv6Calc({ host: "2001:db8::1", prefixStr: "64" });
    expect(r.errors).toEqual([]);
    expect(r.prefix).toBe(64);
    expect(r.compressed).toBe("2001:db8::1");
    expect(r.netInfo.lines.map((l) => l.label)).toEqual([
      "Address",
      "Expanded",
      "Netmask",
      "Wildcard",
      "Network",
      "First",
      "Last",
    ]);
    expect(r.netInfo.addressesPerNet).toContain("2^64");
  });

  it("detects link-local", () => {
    const r = calculateIpv6Calc({ host: "fe80::1", prefixStr: "64" });
    expect(r.netInfo.descriptionItems.map((i) => i.label)).toContain("Link-Local");
  });

  it("flags invalid input", () => {
    const r = calculateIpv6Calc({ host: "gg::1", prefixStr: "129" });
    expect(r.errors).toContain("INVALID ADDRESS: gg::1");
    expect(r.errors).toContain("Illegal value for prefix ('129')");
  });

  it("exports text", () => {
    const r = calculateIpv6Calc({ host: "2001:db8::1", prefixStr: "64" });
    const text = ipv6ToText(r);
    expect(text.split("\n").some((l) => l.startsWith("Address") && l.includes("2001:db8::1"))).toBe(true);
    expect(text).toContain("Addresses/Net");
  });
});