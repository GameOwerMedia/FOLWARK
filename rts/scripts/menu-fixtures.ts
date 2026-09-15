import {writeFileSync,mkdirSync} from 'node:fs';
import {World} from '../src/simulation/World';
import {exportGame} from '../src/game/SaveStore';
mkdirSync('output/playwright',{recursive:true});
const world=new World('sandbox');world.resources.gold=321;
writeFileSync('output/playwright/import-good.json',exportGame(world));
writeFileSync('output/playwright/import-bad.json','{broken');
