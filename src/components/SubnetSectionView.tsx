import type { SubnetSection } from "../lib/types";
import { IpLineRow } from "./IpLineRow";
import { DescriptionTags } from "./DescriptionTags";
import { intToIp } from "../lib/ip";
import { useLang } from "../i18n";

interface Props {
  section: SubnetSection;
}

function localizeHeading(lang: string, heading: string): string {
  if (lang !== "es") return heading;
  return heading.replace(
    /^Subnets after transition from \/(\d+) to \/(\d+)$/,
    "Subredes tras la transición de /$1 a /$2",
  );
}

export function SubnetSectionView({ section }: Props) {
  const { t, ti, lang } = useLang();
  return (
    <section className="card section-card" aria-label="Subnets">
      <h2 className="section-title">{localizeHeading(lang, section.heading)}</h2>
      <div className="lines">
        {section.netmaskLines.map((line) => (
          <IpLineRow key={line.label} line={line} />
        ))}
      </div>
      <h3 className="subnets-heading">{t("subnets.heading")}</h3>
      <div className="subnet-grid">
        {section.entries.map((entry) => (
          <article key={entry.number} className="subnet-entry">
            <header className="subnet-entry-header">
              <span className="subnet-number">{entry.number}.</span>
              <span className="subnet-network">
                {intToIp(entry.lines[0].value)}
                {entry.lines[0].extra ?? ""}
              </span>
            </header>
            <div className="subnet-rows">
              {entry.lines.map((line) => (
                <IpLineRow key={line.label} line={line} />
              ))}
            </div>
            <footer className="subnet-entry-footer">
              <span className="footer-label">{t("hostsNet.label")}</span>
              <span className="footer-value">{entry.hostsPerNet.toLocaleString("es")}</span>
              <DescriptionTags items={entry.descriptionItems} />
            </footer>
          </article>
        ))}
      </div>
      <footer className="section-totals">
        <div className="total-box">
          <span className="total-label">{t("totals.subnets")}</span>
          <span className="total-value">{section.subnetsTotal.toLocaleString("es")}</span>
        </div>
        <div className="total-box">
          <span className="total-label">{t("totals.hosts")}</span>
          <span className="total-value">{section.hostsTotal.toLocaleString("es")}</span>
        </div>
        {section.truncated && (
          <p className="truncated-note">
            {ti("truncated", { first: String(section.entries.length), total: String(section.subnetsTotal) })}
          </p>
        )}
      </footer>
    </section>
  );
}