import type { IpLine } from "../lib/types";
import { intToIp } from "../lib/ip";
import { BinaryOctets } from "./BinaryOctets";

interface Props {
  line: IpLine;
}

export function IpLineRow({ line }: Props) {
  return (
    <div className="line">
      <div className="line-label">{line.label}</div>
      <div className="line-address">
        <span className="line-dotted">{intToIp(line.value)}</span>
        {line.extra ? <span className="line-extra">{line.extra}</span> : null}
      </div>
      <div className="line-binary">
        <BinaryOctets
          value={line.value}
          maskBits={line.maskBits}
          maskColor={line.maskColor}
          ranges={line.ranges}
        />
      </div>
    </div>
  );
}