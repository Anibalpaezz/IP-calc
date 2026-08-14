# Calculadora de Subredes IPv4

Calculadora de subredes IPv4 que replica la lógica de la herramienta clásica `ipcalc`, pero con un frontend moderno, responsive y con recálculo en tiempo real mientras escribes.

- **Stack:** React + Vite + TypeScript
- **Sin backend:** toda la lógica de cálculo se ejecuta en el cliente
- **Lógica testeable:** funciones puras en `src/lib/`, separadas de los componentes de UI

## Funcionalidad

- Cálculo de dirección, netmask (CIDR o decimal), wildcard mask, red, primer/último host, broadcast y hosts utilizables.
- Clase de red (A/B/C) e indicación de rangos privados (RFC 1918).
- División en subredes mediante una segunda netmask opcional.
- Representación binaria agrupada por octetos.

## Cómo levantar el proyecto

```bash
npm install
npm run dev
```

Otros comandos:

```bash
npm run build   # compilación de producción
npm run preview # previsualizar el build
npm run lint    # ESLint
```
