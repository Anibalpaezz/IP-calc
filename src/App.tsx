import { useMemo, useState } from "react";
import { calculateIpCalc } from "./lib/ipcalc";
import { ErrorPanel } from "./components/ErrorPanel";
import { IpLineRow } from "./components/IpLineRow";
import { NetCard } from "./components/NetCard";
import { SubnetSectionView } from "./components/SubnetSectionView";
import { SupernetSectionView } from "./components/SupernetSectionView";

export default function App() {
  const [host, setHost] = useState("192.168.0.1");
  const [mask1, setMask1] = useState("24");
  const [mask2, setMask2] = useState("");

  const result = useMemo(() => calculateIpCalc({ host, mask1, mask2 }), [host, mask1, mask2]);

  return (
    <div className="app">
      <header className="hero">
        <h1>Calculadora de Subredes IPv4</h1>
        <p>
          Replica la lógica de <code>ipcalc</code> con recálculo en tiempo real. Los resultados se
          actualizan mientras escribes.
        </p>
      </header>

      <form className="card form-card" onSubmit={(e) => e.preventDefault()}>
        <div className="field">
          <label htmlFor="host">Address (Host or Network)</label>
          <input
            id="host"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            placeholder="192.168.0.1"
            value={host}
            onChange={(e) => setHost(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="mask1">Netmask (i.e. 24 o /24)</label>
          <input
            id="mask1"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            placeholder="24"
            value={mask1}
            onChange={(e) => setMask1(e.target.value)}
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

      <ErrorPanel errors={result.errors} />

      <main className="results">
        <section className="card main-section" aria-label="Resultado principal">
          {result.netInfo.lines.slice(0, 3).map((line) => (
            <IpLineRow key={line.label} line={line} />
          ))}
          <NetCard info={{ ...result.netInfo, lines: result.netInfo.lines.slice(3) }} showArrow />
        </section>

        {result.subnetSection && <SubnetSectionView section={result.subnetSection} />}
        {result.supernetSection && <SupernetSectionView section={result.supernetSection} />}
      </main>

      <footer className="footer">
        Basado en <code>ipcalc</code> de Krischan Jodies (jodies.de/ipcalc). Toda la lógica se
        ejecuta en tu navegador.
      </footer>
    </div>
  );
}