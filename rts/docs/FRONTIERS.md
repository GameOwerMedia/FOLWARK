# Frontiers update

## Play
The world is 5400 x 3600 (2.25 times the previous map area).
Fences and gates are paid construction projects, never free perimeter scenery.
Build horizontal or vertical 100-unit sections, snapped to a 50-unit grid.
A closed gate blocks residents, traders, envoys and predators alike. Open it in
the selected gate's inspector. It cannot close on an occupied crossing.
Dogs automatically respond locally; guard and patrol orders position them.

Wolves hunt larger farm species only after severe hunger and a long cooldown.
Foxes hunt hens, ducks, geese and cats. Closed routes block pursuit and attacks.
Hungry, mistreated residents may physically attempt to reach the map boundary;
fencing can contain them but does not remove the cause of their distress.

## Politics
Pigs can walk on diplomatic missions. Ravens retain aerial treaty delivery.
Printing Press unlocks propaganda. Solidarity unlocks revolution and federation.
The neighbor panel displays government, leader, population, stock, influence and
propaganda. Human rule must be overthrown before a federation proposal.
Commerce reserves 40 actual grain at negotiation; it is delivered on return.
Housing is checked again before a new resident joins. Failed talks do not refund
the expedition cost. An envoy blocked by a closed gate waits for a route.
Federation members contribute up to 20 surplus grain per day, provided their
own stock exceeds 100. This contribution is currently a daily ledger transfer,
not a separately rendered wagon.

Neighbor food and fuel budgets affect health and staffing. Sustained starvation
reduces population and can collapse a farm. Aid requests and voluntary accession
are interactive. Government compatibility changes relations over time.
There are still three neighboring farms; this is not a full grand-strategy AI.

## Development
Eleven research nodes have prerequisites across technology, agriculture, ideas
and propaganda. Research still resolves on purchase, not through a timed queue.
Community Charter unlocks three mutually exclusive constitutions:
civic council (diplomacy discount), directorate (labour and grievance),
commune (gradual grievance reduction).
Residents earn XP through work, combat and completed missions. Six talents form
three two-step branches. Points are spent once, and every species can learn.

## Saves and artwork
Save version 8 preserves wildlife, political farms, character XP and talents.
Versions 1 through 7 migrate without deleting residents or resource inventories.
The built-in image-generation tool created the wolf/fox/farmer atlas in
public/assets/wildlife.png. The final prompt preserved the three full-body
characters on flat #FF00FF for chroma-key game rendering. WildlifeArt.ts keys
the atlas at texture upload; no raw background appears on the map.

## Verification
npm test
npm run build
npx --no-install playwright-cli -s=folwark run-code --filename scripts/frontiers-browser.js
