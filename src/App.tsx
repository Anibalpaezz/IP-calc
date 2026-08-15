import { useEffect, useMemo, useState } from "react";
import { calculateIpCalc } from "./lib/ipcalc";
import { calculateIpv6Calc } from "./lib/ipv6calc";
import { ipv4ToText, ipv6ToText } from "./lib/export";
import { ErrorPanel } from "./components/ErrorPanel";
import { IpLineRow } from "./components/IpLineRow";
import { NetCard } from "./components/NetCard";
import { SubnetSectionView } from "./components/SubnetSectionView";
import { SupernetSectionView } from "./components/SupernetSectionView";
import { Ipv6SectionView } from "./components/Ipv6SectionView";

const DEFAULT_HOST = "192.168.0.1";
const DEFAULT_MASK1 = "24";

type Theme = "light" | "dark";

function initialTheme(): Theme {
  const param = new URLSearchParams(window.location.search).get("theme");
  if (param === "light" || param === "dark") return param;
  try {
    const stored = localStorage.getItem("ipcalc-theme");
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* ignore */
  }
  return "light";
}

const IPv4_PRESETS = [8, 12, 16, 24, 25, 26, 27, 28, 30, 32];
const IPv6_PRESETS = [32, 48, 56, 64, 80, 96, 128];

export default function App() {
  const [host, setHost] = useState(() => new URLSearchParams(window.location.search).get("host") ?? DEFAULT_HOST);
  const [mask1, setMask1] = useState(() => {
    const hostCidr = (new URLSearchParams(window.location.search).get("host") ?? "").match(/^(.+)\/(\d{1,3})$/);
    if (hostCidr) return hostCidr[2];
    return new URLSearchParams(window.location.search).get("mask1") ?? DEFAULT_MASK1;
  });
  const [mask2, setMask2] = useState(() => new URLSearchParams(window.location.search).get("mask2") ?? "");
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("ipcalc-theme", theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    const sp = new URLSearchParams();
    if (host) sp.set("host", host);
    if (mask1) sp.set("mask1", mask1);
    if (mask2) sp.set("mask2", mask2);
    if (theme) sp.set("theme", theme);
    const qs = sp.toString();
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [host, mask1, mask2, theme]);

  const split = useMemo(() => {
    const m = host.match(/^(.+)\/(\d{1,3})$/);
    return m ? { address: m[1], cidr: m[2] } : { address: host, cidr: null };
  }, [host]);

  const isIpv6 = split.address.includes(":");
  const effectiveHost = split.address;
  const effectiveMask1 = split.cidr ?? mask1;
  const effectiveMask2 = isIpv6 ? "" : mask2;

  const ipv4 = useMemo(
    () => (!isIpv6 ? calculateIpCalc({ host: effectiveHost, mask1: effectiveMask1, mask2: effectiveMask2 }) : null),
    [isIpv6, effectiveHost, effectiveMask1, effectiveMask2],
  );

  const ipv6 = useMemo(
    () => (isIpv6 ? calculateIpv6Calc({ host: effectiveHost, prefixStr: effectiveMask1 }) : null),
    [isIpv6, effectiveHost, effectiveMask1],
  );

  const errors = (isIpv6 ? ipv6?.errors : ipv4?.errors) ?? [];

  const handleHostChange = (value: string) => {
    setHost(value);
    const m = value.match(/^(.+)\/(\d{1,3})$/);
    if (m) {
      const c = Number(m[2]);
      if (c >= 0 && c <= 128) setMask1(m[2]);
    }
  };

  const handleMask1Change = (value: string) => {
    setMask1(value);
    const slash = host.indexOf("/");
    if (slash !== -1) setHost(host.slice(0, slash));
  };

  const applyPreset = (bits: number) => {
    setMask1(String(bits));
    const slash = host.indexOf("/");
    if (slash !== -1) setHost(host.slice(0, slash));
  };

  const copyResult = async () => {
    const text = isIpv6 ? (ipv6 ? ipv6ToText(ipv6) : "") : ipv4 ? ipv4ToText(ipv4) : "";
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const presets = isIpv6 ? IPv6_PRESETS : IPv4_PRESETS;

  return (
    <div className="app">
      <header className="hero">
        <button
          type="button"
          className="theme-toggle"
          onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        >
          {theme === "dark" ? "Tema claro" : "Tema oscuro"}
        </button>
        <h1>Calculadora de Subredes</h1>
        <p>
          Calculadora IPv4 (estilo <code>ipcalc</code>) e IPv6 con recálculo en tiempo real. Los
          resultados se actualizan mientras escribes.
        </p>
      </header>

      <form className="card form-card" onSubmit={(e) => e.preventDefault()}>
        <div className="field">
          <label htmlFor="host">Address (Host or Network)</label>
          <input
            id="host"
            type="text"
            autoComplete="off"
            spellCheck={false}
            placeholder="192.168.0.1"
            value={host}
            onChange={(e) => handleHostChange(e.target.value)}
          />
          <span className="field-hint">
            Acepta <code>192.168.0.1/24</code> o <code>2001:db8::1/64</code>
          </span>
        </div>
        <div className="field">
          <label htmlFor="mask1">{isIpv6 ? "Prefix (i.e. 64 o /64)" : "Netmask (i.e. 24 o /24)"}</label>
          <input
            id="mask1"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            placeholder="24"
            value={mask1}
            onChange={(e) => handleMask1Change(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="mask2">Netmask for sub/supernet (optional)</label>
          <input
            id="mask2"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            placeholder="26"
            value={mask2}
            onChange={(e) => setMask2(e.target.value)}
          />
        </div>
      </form>

      <div className="presets">
        <span className="presets-label">Presets:</span>
        {presets.map((bits) => (
          <button
            key={bits}
            type="button"
            className={`preset-btn ${Number(effectiveMask1) === bits ? "is-active" : ""}`}
            onClick={() => applyPreset(bits)}
          >
            /{bits}
          </button>
        ))}
      </div>

      <div className="toolbar">
        <span className={`mode-badge ${isIpv6 ? "ipv6" : "ipv4"}`}>{isIpv6 ? "IPv6" : "IPv4"}</span>
        <button type="button" className={`tool-btn ${copied ? "copied" : ""}`} onClick={copyResult}>
          {copied ? "Copiado" : "Copiar texto"}
        </button>
      </div>

      <ErrorPanel errors={errors} />

      <main className="results">
        {ipv4 && (
          <section className="card main-section" aria-label="Resultado principal">
            {ipv4.netInfo.lines.slice(0, 3).map((line) => (
              <IpLineRow key={line.label} line={line} />
            ))}
            <NetCard info={{ ...ipv4.netInfo, lines: ipv4.netInfo.lines.slice(3) }} showArrow />
          </section>
        )}

        {ipv4?.subnetSection && <SubnetSectionView section={ipv4.subnetSection} />}
        {ipv4?.supernetSection && <SupernetSectionView section={ipv4.supernetSection} />}

        {ipv6 && <Ipv6SectionView result={ipv6} />}
      </main>

      <details className="legend card">
        <summary>¿Qué significa cada campo?</summary>
        <ul>
          <li>
            <strong>Address:</strong> la dirección IP (host o red) que escribiste. En IPv4 también
            puedes escribirla con prefijo: <code>192.168.0.1/24</code>.
          </li>
          <li>
            <strong>Netmask:</strong> máscara de red (CIDR <code>/24</code>, decimal{" "}
            <code>255.255.255.0</code> o wildcard inversa <code>0.0.0.255</code>). Separa la parte de
            red de la de host.
          </li>
          <li>
            <strong>Wildcard:</strong> comodín inverso de la máscara (los bits de host a 1); se usa en
            ACLs.
          </li>
          <li>
            <strong>Network:</strong> la dirección base de la subred.
          </li>
          <li>
            <strong>HostMin / HostMax:</strong> primer y último host utilizables de la subred.
          </li>
          <li>
            <strong>Broadcast:</strong> dirección de difusión a todos los hosts de la subred.
          </li>
          <li>
            <strong>Hosts/Net:</strong> direcciones utilizables (el clásico <code>2ⁿ − 2</code>, salvo{" "}
            <code>/31</code> con 2 y <code>/32</code> con 1).
          </li>
          <li>
            <strong>Second netmask:</strong> si es mayor que la primera divide en subredes; si es menor,
            calcula la superred que las agrupa.
          </li>
        </ul>
      </details>

      <footer className="footer">
        <p>
          Develop by{" "}
          <a className="footer-link" href="https://anibalpaezzgallego.com" target="_blank" rel="noreferrer">
            Anibal Paez Gallego
          </a>
        </p>
      </footer>
    </div>
  );
}