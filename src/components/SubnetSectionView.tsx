import type { SubnetSection } from "../lib/types";
import { IpLineRow } from "./IpLineRow";
import { DescriptionTags } from "./DescriptionTags";
import { intToIp } from "../lib/ip";

interface Props {
  section: SubnetSection;
}

export function SubnetSectionView({ section }: Props) {
  return (
    <section className="card section-card" aria-label={section.heading}>
      <h2 className="section-title">{section.heading}</h2>
      <div className="lines">
        {section.netmaskLines.map((line) => (
          <IpLineRow key={line.label} line={line} />
        ))}
      </div>
      <h3 className="subnets-heading">Subredes</h3>
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
              <span className="footer-label">Hosts/Net</span>
              <span className="footer-value">{entry.hostsPerNet.toLocaleString("es")}</span>
              <DescriptionTags items={entry.descriptionItems} />
            </footer>
          </article>
        ))}
      </div>
      <footer className="section-totals">
        <div className="total-box">
          <span className="total-label">Subnets</span>
          <span className="total-value">{section.subnetsTotal.toLocaleString("es")}</span>
        </div>
        <div className="total-box">
          <span className="total-label">Hosts</span>
          <span className="total-value">{section.hostsTotal.toLocaleString("es")}</span>
        </div>
        {section.truncated && (
          <p className="truncated-note">
            Mostrando las primeras {section.entries.length} subredes de{" "}
            {section.subnetsTotal.toLocaleString("es")} (límite de renderizado).
          </p>
        )}
      </footer>
    </section>
  );
}