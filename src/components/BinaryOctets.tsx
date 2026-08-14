import type { ReactElement } from "react";
import { getBit } from "../lib/ip";
import type { BitRange, BitRangeColor } from "../lib/types";

interface Props {
  value: number;
  maskBits: number;
  maskColor?: boolean;
  ranges?: BitRange[];
}

const RANGE_CLASS: Record<BitRangeColor, string> = {
  class: "bit-class",
  subnet: "bit-subnet",
};

export function BinaryOctets({ value, maskBits, maskColor, ranges }: Props) {
  const colorFor = (j: number): string => {
    if (ranges) {
      for (const range of ranges) {
        if (j >= range.start && j <= range.end) return RANGE_CLASS[range.color];
      }
    }
    if (maskColor && j <= maskBits) return "bit-mask";
    return j <= maskBits ? "bit-net" : "bit-host";
  };

  const cells: ReactElement[] = [];
  for (let j = 1; j <= 32; j++) {
    const on = getBit(value, j) === 1;
    cells.push(
      <span key={`b${j}`} className={`bit ${colorFor(j)}`}>
        {on ? "1" : "0"}
      </span>,
    );
    if (j === maskBits && maskBits < 32) {
      cells.push(<span key="div" className="bit-divider" aria-hidden />);
    }
    if (j % 8 === 0 && j < 32) {
      cells.push(
        <span key={`dot${j}`} className="bit-dot" aria-hidden>
          .
        </span>,
      );
    }
  }

  return <span className="binary">{cells}</span>;
}