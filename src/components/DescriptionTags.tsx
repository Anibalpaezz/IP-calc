import type { DescriptionItem } from "../lib/types";

interface Props {
  items: DescriptionItem[];
}

const KIND_LABEL: Record<DescriptionItem["kind"], string> = {
  class: "Clase",
  rfc1918: "RFC 1918",
  special: "",
  ptp: "RFC 3021",
};

export function DescriptionTags({ items }: Props) {
  if (items.length === 0) return null;
  return (
    <div className="tags">
      {items.map((item) => {
        const label =
          item.kind === "rfc1918"
            ? `${item.label} · ${KIND_LABEL.rfc1918}`
            : item.kind === "ptp"
              ? `${item.label} · ${KIND_LABEL.ptp}`
              : item.label;
        const cls = `tag tag-${item.kind}`;
        return item.url ? (
          <a key={item.label} className={cls} href={item.url} target="_blank" rel="noreferrer">
            {label}
          </a>
        ) : (
          <span key={item.label} className={cls}>
            {label}
          </span>
        );
      })}
    </div>
  );
}