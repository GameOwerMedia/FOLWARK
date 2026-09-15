# Roles, Diplomacy and the Assembly

This is an independent interpretation of Animal Farm. Historical character names
do not lock a resident into permanent office.

## Starting community
New games start with 22 residents, including Napoleon, Snowball, Squealer, Boxer,
Clover, Benjamin, Mollie, Muriel, Jessie, Bluebell, Pincher and Moses.
The pasture supports cattle and sheep. Existing saves keep their existing
population; start a new game to get the expanded cast and starting pasture.

## Work
Species have different efficiencies, carrying capacities and natural duties.
Automatic staffing chooses qualified workers; only capable idle builders join
construction automatically. A selected resident's panel offers their natural
duty and a work-assignment selector.

Unsuitable physical work requires an explicit confirmation. It runs at 15% of
ordinary output and increases fatigue, grievance and health damage. Rest and
food breaks still apply. A forced worker can protest or die.
Species-specific biological production cannot be transferred: a pig cannot lay
eggs, even under coercion.

Cows produce milk, hens and ducks eggs, sheep wool, goats herbs. Production
consumes feed and respects storage capacity. Milk and eggs feed residents;
herbs support nearby healing. Wool bedding costs 12 wool per level, up to three
levels, each reducing fuel use by 10%. New goods can also be traded.
Donkeys and literate animals conduct research; pigs and heralds organise the
community. Public bulletins require an assigned spokesperson.

## Diplomacy
Select a raven or open Neighbours. Dispatch an available envoy to negotiate
trade, non-aggression or knowledge exchange. The raven flies directly, lands
for negotiations and returns with documents. Agreements take effect on return,
not when the dispatch button is clicked.

Trade agreements discount that neighbour's convoys by 20%. Non-aggression
maintains at least 60% relations. Knowledge exchanges grant 20 knowledge on
ratification. Agreements expire after three game days. Embargoes can cause
rejection; a dead envoy cannot ratify a treaty. Missions reserve the envoy and
prevent conflicting movement or work orders. The bird has separate perched
and airborne appearances.

## Elections
Council shows every living resident as a candidate. Each has a programme and
a poll estimate. Campaign meetings cost 10 coins each, at most three per
candidate per election. Each living resident casts one vote based on programme
preference, familiarity, candidate qualities and campaign support.

Any individual can win, regardless of species. Winners adopt their programme:
food security, productivity, patrol effectiveness, research or commerce.
Privileged rations follow the leader's species and guards rather than always
following pigs. Another election becomes available after two game days.
A leader's death opens succession immediately.

## Saves and checks
Version 6 saves preserve roles, forced assignments, elections, bedding, envoy
missions and treaties. Versions 1-5 remain readable. Old unsuitable job
assignments are cleared without deleting their cargo or residents.

Run npm test, npm run typecheck and scripts/society-browser.js through
playwright-cli. Tests cover every starting resident winning a ballot,
coercion, production inputs/capacity, flight and return, expiry, death,
migration, malformed saves and English/Polish controls.
