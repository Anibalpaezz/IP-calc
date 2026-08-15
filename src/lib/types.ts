export interface CalcInput {
  host: string;
  mask1: string;
  mask2: string;
}

export type BitRangeColor = "class" | "subnet";

export interface BitRange {
  /** 1-based bit index, MSB first. */
  start: number;
  /** 1-based bit index, MSB first, inclusive. */
  end: number;
  color: BitRangeColor;
}

export interface IpLine {
  label: string;
  value: number;
  /** Suffix appended to the dotted-decimal, e.g. " = 24" or "/24". */
  extra?: string;
  /** Bit count after which the network/host separator is shown. */
  maskBits: number;
  /** Color the netmask bits (used for Netmask lines). */
  maskColor?: boolean;
  /** Highlight the class bits (used for the Network line). */
  highlightClass?: boolean;
  /** Optional bit ranges to highlight (class bits / new subnet bits). */
  ranges?: BitRange[];
}

export type DescriptionKind = "class" | "rfc1918" | "special" | "ptp";

export interface DescriptionItem {
  label: string;
  url?: string;
  kind: DescriptionKind;
}

export interface NetInfo {
  lines: IpLine[];
  hostsPerNet: number;
  descriptionItems: DescriptionItem[];
  description: string;
}

export interface SubnetEntry extends NetInfo {
  number: number;
}

export interface SubnetSection {
  heading: string;
  netmaskLines: IpLine[];
  entries: SubnetEntry[];
  subnetsTotal: number;
  hostsTotal: number;
  truncated: boolean;
}

export interface SupernetSection extends NetInfo {
  heading: string;
  netmaskLines: IpLine[];
}

export interface IpCalcResult {
  errors: string[];
  usedFallbacks: boolean;
  address: number;
  mask1Bits: number;
  mask2Bits: number | null;
  netInfo: NetInfo;
  subnetSection: SubnetSection | null;
  supernetSection: SupernetSection | null;
}

export interface Ipv6Line {
  label: string;
  value: string;
  extra?: string;
}

export interface Ipv6NetInfo {
  lines: Ipv6Line[];
  addressesPerNet: string;
  descriptionItems: DescriptionItem[];
}

export interface Ipv6CalcResult {
  errors: string[];
  address: bigint;
  expanded: string;
  compressed: string;
  prefix: number;
  netInfo: Ipv6NetInfo;
}