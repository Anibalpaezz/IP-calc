# Calculadora de Subredes IPv4

Calculadora de subredes IPv4 que replica la lógica de la herramienta clásica `ipcalc`, pero con un frontend moderno, responsive y con recálculo en tiempo real mientras escribes.

- **Stack:** React + Vite + TypeScript
- **Sin backend:** toda la lógica de cálculo se ejecuta en el cliente, con recálculo en tiempo real mientras escribes
- **Lógica testeable:** funciones puras en `src/lib/`, separadas de los componentes de UI (con tests en Vitest)

## Estructura

```
src/
  lib/            # Lógica pura (ip.ts, ipcalc.ts, types.ts) + tests
  components/     # Componentes de UI (BinaryOctets, NetCard, etc.)
  App.tsx         # Estado de los inputs y recálculo (useMemo)
  main.tsx
  index.css
```

## Funcionalidad

- Cálculo de dirección, netmask (CIDR `/24` o decimal `255.255.255.0`, y wildcard inversa), wildcard mask, red, primer/último host, broadcast y hosts utilizables.
- Clase de red (A/B/C/D/E), rangos privados (RFC 1918), APIPA, Loopback y Multicast.
- División en subredes o superredes mediante una segunda netmask opcional.
- Representación binaria agrupada por octetos, con el separador red/host y resaltado de bits de clase y de subred nuevas.
- Casos especiales `/31` (PtP link, RFC 3021) y `/32` (host route), como `ipcalc`.
- Validaciones con mensajes claros tipo ipcalc: `No host given`, `Illegal value for netmask`, etc.

## Cómo levantar el proyecto

```bash
npm install
npm run dev
```

Otros comandos:

```bash
npm run build   # compilación de producción (typecheck + build)
npm run preview # previsualizar el build
npm run lint    # ESLint
npm test        # tests de la lógica (Vitest)
```
