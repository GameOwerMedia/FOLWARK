# FOLWARK RTS rebuild

This directory is the staged RTS migration of the original single-file FOLWARK political simulator.

## Current milestone

The original game on `main` remains untouched.

The `rts-rebuild` branch currently contains:

- Vite + TypeScript + Phaser 3 application shell
- a separate simulation-facing `AnimalState` model
- a first top-down farm scene
- selectable animal units
- right-click movement orders
- demo units for Boxer, Napoleon and Bluebell

## Run locally

```bash
cd rts
npm install
npm run dev
```

## Design rule

Do not port everything at once. Existing simulation behavior should be extracted subsystem by subsystem and verified before the old implementation is removed.

The RTS target is a spatial political simulation, not a conventional combat-heavy RTS. Production, movement, hunger, class, propaganda, elections, coercion, factional politics and rebellion must interact through visible individual animals.

## Migration order

1. **Spatial control** — selection, movement, camera, map.
2. **Jobs** — assign an animal to a field; walk there; work; produce a resource; accumulate fatigue/hunger.
3. **Needs simulation** — hunger, health, fatigue and food consumption.
4. **Economy** — grain, grass, meat, water and storage become spatial resources.
5. **Existing personalities** — courage, loyalty, grievance, docility, ambition and voice migrate from the original simulation.
6. **Politics** — constitution, elections, propaganda, repression and inequality.
7. **Institutions** — farmhouse, dogs, pig council, assemblies and the barn-wall official narrative.
8. **Factions** — political blocs emerge from individual agents.
9. **Physical crises** — riots, coups, uprisings and human attacks occur on the map.
10. **History system** — Journal vs Official History remains a defining mechanic.

## Next playable milestone

**Boxer works a wheat field.**

The player should be able to select Boxer and order him to a wheat field. Boxer walks to the field, enters a `working` task, generates grain over time, gains fatigue and hunger, and can stop working to eat or rest.

That vertical slice establishes the architecture for almost every later system.
