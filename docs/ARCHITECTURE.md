# ORBIT Health: Architecture

## Stack
React 18, Vite, TypeScript (strict), Tailwind 3, React Router 6, Zustand, Zod, React Hook Form,
Recharts, Lucide, date-fns, Vitest + Testing Library. No backend in v1.

## Layers
- `src/engine/`: pure functions, no React. Measurements in, RiskFlags out.
- `src/services/`: storage, ingest (sensor adapters) and simulated comms. The only I/O boundary.
- `src/store/`: Zustand slices, persisted through StorageAdapter.
- `src/components/`, `src/pages/`: UI only; read from the store, never contain rules.
- `src/data/`: SIMULATED profiles, scenarios, hazards and the citation registry.

## Engine flow
Measurement[] -> data quality check -> baseline (rolling median + MAD; falls back to a general
reference range and says so when history is short) -> deviation and trend -> rule match ->
RiskFlag[] (with confidence, limitations, escalation) -> alert state + recommendations.

## Integration readiness
Real sensors implement `SensorAdapter`. Real persistence implements `StorageAdapter`.
Nothing else in the app changes.