import type { Ipv6CalcResult } from "../lib/types";
import { DescriptionTags } from "./DescriptionTags";
import { useLang } from "../i18n";

interface Props {
  result: Ipv6CalcResult;
}

export function Ipv6SectionView({ result }: Props) {
  const { t } = useLang();
  return (
    <section className="card section-card" aria-label="IPv6">
      <h2 className="section-title">IPv6</h2>
      <div className="lines">
        {result.netInfo.lines.map((line) => (
          <div key={line.label} className="line ipv6-line">
            <div className="line-label">{line.label}</div>
            <div className="line-address">
              <span className="line-dotted">{line.value}</span>
              {line.extra ? <span className="line-extra">{line.extra}</span> : null}
            </div>
          </div>
        ))}
      </div>
      <div className="net-footer">
        <div className="footer-hosts">
          <span className="footer-label">{t("addressesNet.label")}</span>
          <span className="footer-value">{result.netInfo.addressesPerNet}</span>
        </div>
        <DescriptionTags items={result.netInfo.descriptionItems} />
      </div>
    </section>
  );
}