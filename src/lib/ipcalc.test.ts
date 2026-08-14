import { describe, expect, it } from "vitest";
import {
  bitcount,
  calculateIpCalc,
  classOf,
  naturalMaskBits,
  parseNetmaskResult,
} from "./ipcalc";
import { intToIp, parseIp } from "./ip";

const run = (host: string, mask1: string, mask2 = "") =>
  calculateIpCalc({ host, mask1, mask2 });

const lineValues = (r: { lines: { label: string; value: number; extra?: string }[] }) =>
  r.lines.map((l) => [l.label, intToIp(l.value), l.extra ?? ""]);

describe("parseNetmaskResult", () => {
  it("accepts CIDR notation with and without slash", () => {
    expect(parseNetmaskResult("24")).toEqual({ ok: true, value: 0xffffff00, bits: 24 });
    expect(parseNetmaskResult("/24")).toEqual({ ok: true, value: 0xffffff00, bits: 24 });
    expect(parseNetmaskResult("0")).toEqual({ ok: true, value: 0, bits: 0 });
    expect(parseNetmaskResult("32")).toEqual({ ok: true, value: 0xffffffff, bits: 32 });
  });

  it("accepts dotted decimal netmasks", () => {
    expect(parseNetmaskResult("255.255.255.0")).toEqual({ ok: true, value: 0xffffff00, bits: 24 });
    expect(parseNetmaskResult("255.255.128.0")).toEqual({ ok: true, value: 0xffff8000, bits: 17 });
  });

  it("accepts wildcard (inverse) netmasks", () => {
    expect(parseNetmaskResult("0.0.0.255")).toEqual({ ok: true, value: 0xffffff00, bits: 24 });
  });

  it("rejects illegal netmasks", () => {
    expect(parseNetmaskResult("255.255.0.1").ok).toBe(false);
    expect(parseNetmaskResult("33").ok).toBe(false);
    expect(parseNetmaskResult("256.1.1.1").ok).toBe(false);
    expect(parseNetmaskResult("255.255.255").ok).toBe(false);
    expect(parseNetmaskResult("abc").ok).toBe(false);
  });
});

describe("bitcount and class", () => {
  it("counts leading ones", () => {
    expect(bitcount(0)).toBe(0);
    expect(bitcount(0xffffff00)).toBe(24);
    expect(bitcount(0xffffffff)).toBe(32);
    expect(bitcount(0x80000000)).toBe(1);
  });

  it("detects network classes", () => {
    expect(classOf(parseIp("192.168.1.0")!)).toBe("C");
    expect(classOf(parseIp("10.0.0.0")!)).toBe("A");
    expect(classOf(parseIp("172.16.0.0")!)).toBe("B");
    expect(classOf(parseIp("224.0.0.0")!)).toBe("D");
    expect(classOf(parseIp("240.0.0.0")!)).toBe("E");
    expect(classOf(0xffffffff)).toBe("invalid");
  });

  it("computes natural (class) netmasks", () => {
    expect(naturalMaskBits(parseIp("10.0.0.1")!)).toBe(8);
    expect(naturalMaskBits(parseIp("172.16.0.1")!)).toBe(16);
    expect(naturalMaskBits(parseIp("192.168.0.1")!)).toBe(24);
  });
});

describe("calculateIpCalc - classic /24", () => {
  const r = run("192.168.0.1", "24");
  it("computes all main fields", () => {
    expect(r.errors).toEqual([]);
    expect(r.netInfo.hostsPerNet).toBe(254);
    expect(lineValues(r.netInfo)).toEqual([
      ["Address", "192.168.0.1", ""],
      ["Netmask", "255.255.255.0", " = 24"],
      ["Wildcard", "0.0.0.255", ""],
      ["Network", "192.168.0.0", "/24"],
      ["HostMin", "192.168.0.1", ""],
      ["HostMax", "192.168.0.254", ""],
      ["Broadcast", "192.168.0.255", ""],
    ]);
  });

  it("describes the network", () => {
    expect(r.netInfo.description).toBe("Class C, Private Internet");
    expect(r.netInfo.descriptionItems.map((i) => i.label)).toEqual([
      "Class C",
      "Private Internet",
    ]);
  });

  it("has no subnet/supernet section", () => {
    expect(r.subnetSection).toBeNull();
    expect(r.supernetSection).toBeNull();
  });
});

describe("calculateIpCalc - /31 and /32", () => {
  it("treats /31 as a point-to-point link", () => {
    const r = run("192.168.1.5", "31");
    expect(r.netInfo.hostsPerNet).toBe(2);
    const labels = r.netInfo.lines.map((l) => l.label);
    expect(labels).toContain("Network");
    expect(labels).not.toContain("Broadcast");
    const network = r.netInfo.lines.find((l) => l.label === "Network")!;
    const hostMin = r.netInfo.lines.find((l) => l.label === "HostMin")!;
    const hostMax = r.netInfo.lines.find((l) => l.label === "HostMax")!;
    expect(hostMin.value).toBe(network.value);
    expect(hostMax.value).toBe((network.value | 1) >>> 0);
    expect(r.netInfo.description).toContain("PtP Link RFC 3021");
  });

  it("handles /32 as a host route", () => {
    const r = run("10.0.0.1", "32");
    expect(r.netInfo.hostsPerNet).toBe(1);
    const labels = r.netInfo.lines.map((l) => l.label);
    expect(labels).toContain("Hostroute");
    expect(labels).not.toContain("Network");
    expect(labels).not.toContain("Broadcast");
  });
});

describe("calculateIpCalc - subnets", () => {
  const r = run("192.168.1.0", "24", "26");
  it("builds the subnet section", () => {
    expect(r.subnetSection).not.toBeNull();
    expect(r.subnetSection!.heading).toBe("Subnets after transition from /24 to /26");
    expect(r.subnetSection!.subnetsTotal).toBe(4);
    expect(r.subnetSection!.hostsTotal).toBe(248);
    expect(r.subnetSection!.entries).toHaveLength(4);
    expect(r.subnetSection!.entries.map((e) => intToIp(e.lines[0].value))).toEqual([
      "192.168.1.0",
      "192.168.1.64",
      "192.168.1.128",
      "192.168.1.192",
    ]);
    expect(r.subnetSection!.entries[0].hostsPerNet).toBe(62);
  });
});

describe("calculateIpCalc - supernet", () => {
  const r = run("192.168.1.0", "24", "16");
  it("aggregates the network", () => {
    expect(r.supernetSection).not.toBeNull();
    expect(r.supernetSection!.heading).toBe("Supernet");
    const network = r.supernetSection!.lines.find((l) => l.label === "Network")!;
    expect(intToIp(network.value)).toBe("192.168.0.0");
    expect(r.supernetSection!.hostsPerNet).toBe(65534);
  });
});

describe("calculateIpCalc - validations", () => {
  it("reports missing host", () => {
    const r = run("", "24");
    expect(r.errors).toContain("No host given");
    expect(r.usedFallbacks).toBe(true);
  });

  it("reports illegal host", () => {
    const r = run("abc", "24");
    expect(r.errors).toContain("Illegal value for host ('abc')");
  });

  it("reports invalid numeric host (octet > 255)", () => {
    const r = run("999.1.1.1", "24");
    expect(r.errors).toContain("INVALID ADDRESS: 999.1.1.1");
  });

  it("reports missing netmask and uses the class default", () => {
    const r = run("10.1.2.3", "");
    expect(r.errors).toContain(
      "No netmask given (using default netmask of your network's class)",
    );
    expect(r.mask1Bits).toBe(8);
  });

  it("reports illegal netmask", () => {
    const r = run("192.168.1.1", "255.255.0.1");
    expect(r.errors).toContain("Illegal value for netmask ('255.255.0.1')");
    expect(r.mask1Bits).toBe(24);
  });

  it("reports illegal subnet netmask", () => {
    const r = run("192.168.1.1", "24", "255.255.0.1");
    expect(r.errors).toContain("Illegal value for netmask for sub/supernet ('255.255.0.1')");
    expect(r.subnetSection).toBeNull();
  });

  it("treats an equal second netmask as empty", () => {
    const r = run("192.168.1.1", "24", "24");
    expect(r.subnetSection).toBeNull();
    expect(r.supernetSection).toBeNull();
  });
});

describe("calculateIpCalc - RFC1918 detection", () => {
  it("marks private networks", () => {
    expect(run("10.0.0.5", "8").netInfo.description).toContain("Private Internet");
    expect(run("172.20.0.5", "12").netInfo.description).toContain("Private Internet");
    expect(run("192.168.1.1", "24").netInfo.description).toContain("Private Internet");
  });

  it("marks partially contained networks", () => {
    const r = run("192.168.1.1", "15");
    expect(r.netInfo.description).toContain("In Part Private Internet");
  });
});