import type { NetInfo } from "../lib/types";
import { IpLineRow } from "./IpLineRow";
import { DescriptionTags } from "./DescriptionTags";
import { useLang } from "../i18n";

interface Props {
  info: NetInfo;
  showArrow?: boolean;
}

export function NetCard({ info, showArrow }: Props) {
  const { t } = useLang();
  return (
    <div className="net-card">
      {showArrow && <div className="arrow">{"=>"}</div>}
      <div className="lines">
        {info.lines.map((line) => (
          <IpLineRow key={line.label} line={line} />
        ))}
      </div>
      <div className="net-footer">
        <div className="footer-hosts">
          <span className="footer-label">{t("hostsNet.label")}</span>
          <span className="footer-value">{info.hostsPerNet.toLocaleString("es")}</span>
        </div>
        <DescriptionTags items={info.descriptionItems} />
      </div>
    </div>
  );
}