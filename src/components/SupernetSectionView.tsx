import type { SupernetSection } from "../lib/types";
import { IpLineRow } from "./IpLineRow";
import { NetCard } from "./NetCard";

interface Props {
  section: SupernetSection;
}

export function SupernetSectionView({ section }: Props) {
  return (
    <section className="card section-card" aria-label={section.heading}>
      <h2 className="section-title">{section.heading}</h2>
      <div className="lines">
        {section.netmaskLines.map((line) => (
          <IpLineRow key={line.label} line={line} />
        ))}
      </div>
      <div className="arrow">{"=>"}</div>
      <NetCard info={section} />
    </section>
  );
}