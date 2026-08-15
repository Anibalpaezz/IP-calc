import { intToIp, toBinary32 } from "./ip";
import type { IpCalcResult, Ipv6CalcResult, SubnetSection, SupernetSection } from "./types";

function formatLine(label: string, value: string, binary = ""): string {
  const line = `${label.padEnd(11)}${value.padEnd(26)}`;
  return binary ? `${line}${binary}` : line.trimEnd();
}

export function ipv4ToText(r: IpCalcResult): string {
  const out: string[] = [];
  for (const line of r.netInfo.lines) {
    const value = `${intToIp(line.value)}${line.extra ?? ""}`;
    out.push(formatLine(line.label, value, toBinary32(line.value)));
  }
  out.push(formatLine("Hosts/Net", String(r.netInfo.hostsPerNet), r.netInfo.description));
  if (r.subnetSection) out.push(...subnetSectionToText(r.subnetSection));
  if (r.supernetSection) out.push(...supernetSectionToText(r.supernetSection));
  return out.join("\n");
}

function subnetSectionToText(s: SubnetSection): string[] {
  const out: string[] = ["", s.heading];
  for (const entry of s.entries) {
    const network = entry.lines[0];
    const value = `${intToIp(network.value)}${network.extra ?? ""}`;
    out.push(`${formatLine(`${entry.number}.`, value)}   Hosts/Net: ${entry.hostsPerNet}`);
  }
  out.push(`Subnets: ${s.subnetsTotal}   Hosts: ${s.hostsTotal}`);
  return out;
}

function supernetSectionToText(s: SupernetSection): string[] {
  const out: string[] = ["", s.heading];
  for (const line of s.lines) {
    out.push(formatLine(line.label, `${intToIp(line.value)}${line.extra ?? ""}`));
  }
  out.push(formatLine("Hosts/Net", String(s.hostsPerNet), s.description));
  return out;
}

export function ipv6ToText(r: Ipv6CalcResult): string {
  const out: string[] = [];
  for (const line of r.netInfo.lines) {
    out.push(`${line.label.padEnd(11)}${line.value}${line.extra ?? ""}`);
  }
  out.push(
    `${"Addresses/Net".padEnd(11)}${r.netInfo.addressesPerNet}  ${r.netInfo.descriptionItems
      .map((i) => i.label)
      .join(", ")}`,
  );
  return out.join("\n");
}