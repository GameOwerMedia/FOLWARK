# FOLWARK RTS rebuild

This directory is the staged RTS migration of the original single-file FOLWARK political simulator.

## Current milestone

The original game on `main` remains untouched.

The `rts-rebuild` branch currently contains:

- Vite + TypeScript + Phaser 3 application shell
- a separate simulation-facing `AnimalState` model
- a top-down farm scene
- selectable animal units
- right-click movement orders
- demo units for Boxer, Napoleon and Bluebell
- wheat-field job assignment
- per-animal carried grain inventory and carrying capacity
- physical harvest → haul → barn deposit loop
- hunger and fatigue accumulation during work
- eating from stored grain
- resting and fatigue recovery
- autonomous return to work after eating/resting when an animal remains assigned to harvest
- HUD feedback for task, carried grain, hunger and fatigue

## Run locally

```bash
cd rts
npm install
npm run dev
```

Typecheck/build:

```bash
npm run build
```

## Design rule

Do not port everything at once. Existing simulation behavior should be extracted subsystem by subsystem and verified before the old implementation is removed.

The RTS target is a spatial political simulation, not a conventional combat-heavy RTS. Production, movement, hunger, class, propaganda, elections, coercion, factional politics and rebellion must interact through visible individual animals.

## Migration order

1. **Spatial control** — selection, movement, camera, map.
2. **Jobs** — assign an animal to a field; walk there; harvest; carry and deposit resources; accumulate fatigue/hunger.
3. **Needs simulation** — hunger, health, fatigue, food consumption and autonomous recovery.
4. **Economy** — grain, grass, meat, water, storage and transport become spatial resources.
5. **Existing personalities** — courage, loyalty, grievance, docility, ambition and voice migrate from the original simulation.
6. **Politics** — constitution, elections, propaganda, repression and inequality.
7. **Institutions** — farmhouse, dogs, pig council, assemblies and the barn-wall official narrative.
8. **Factions** — political blocs emerge from individual agents.
9. **Physical crises** — riots, coups, uprisings and human attacks occur on the map.
10. **History system** — Journal vs Official History remains a defining mechanic.

## Playable loop now

Select an animal and right-click the wheat field.

The animal walks to the field, harvests grain into its own carried inventory, then physically travels to the barn and deposits it. If hungry it eats from the barn stock; if exhausted it goes to the rest yard. Animals assigned to harvesting return to the field automatically after recovering, creating the first persistent RTS production cycle.

## Next milestone

Make the economy create politics:

- add passive hunger for all animals and health loss from starvation
- make food access/ration policy unequal by species/class
- convert prolonged hunger and overwork into grievance and loyalty changes
- introduce the first visible protest state when grievance crosses a threshold
- show those political consequences on individual animals rather than only as aggregate percentages
