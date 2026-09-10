import Phaser from 'phaser';
import { AnimalState, createAnimal } from '../simulation/Animal';
import {
  createEconomy,
  depositGrain,
  eatFromStore,
  harvestToInventory,
  idleRecovery,
  rest,
} from '../simulation/Economy';
import {
  applyPoliticalPressure,
  createPolitics,
  rationCost,
  shouldProtest,
  shouldRefuseWork,
  updateUnrest,
} from '../simulation/Politics';

type Unit = {
  state: AnimalState;
  body: Phaser.GameObjects.Container;
  ring: Phaser.GameObjects.Arc;
  status: Phaser.GameObjects.Text;
  assignedHarvest: boolean;
};

export class FarmScene extends Phaser.Scene {
  private units: Unit[] = [];
  private selected: Unit[] = [];
  private economy = createEconomy();
  private politics = createPolitics();
  private grainText!: Phaser.GameObjects.Text;
  private fieldText!: Phaser.GameObjects.Text;
  private politicsText!: Phaser.GameObjects.Text;
  private infoText!: Phaser.GameObjects.Text;
  private rationButton!: Phaser.GameObjects.Text;
  private wheatZone = new Phaser.Geom.Rectangle(70, 80, 330, 210);
  private barnZone = new Phaser.Geom.Rectangle(500, 120, 110, 100);
  private restZone = new Phaser.Geom.Rectangle(500, 360, 150, 100);
  private protestZone = new Phaser.Geom.Rectangle(675, 300, 185, 90);

  constructor() {
    super('FarmScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#171208');
    this.drawFarm();
    this.spawnDemoAnimals();
    this.createHud();

    this.input.mouse?.disableContextMenu();
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.rightButtonDown()) return;
      if (Phaser.Geom.Rectangle.Contains(this.wheatZone, pointer.worldX, pointer.worldY)) this.issueHarvestOrder();
      else this.issueMove(pointer.worldX, pointer.worldY);
    });
  }

  update(_time: number, deltaMs: number) {
    const dt = Math.min(deltaMs / 1000, 0.1);

    for (const unit of this.units) applyPoliticalPressure(unit.state, this.politics, dt);
    updateUnrest(this.units.map((u) => u.state), this.politics);

    for (const unit of this.units) {
      const a = unit.state;

      if (shouldProtest(a, this.politics) && a.task !== 'protesting' && a.task !== 'moving' && a.task !== 'hauling') {
        unit.assignedHarvest = false;
        this.sendToProtest(unit);
      } else if (shouldRefuseWork(a) && a.task === 'harvest') {
        unit.assignedHarvest = false;
        a.task = 'refusing';
      }

      if (a.task === 'harvest') {
        harvestToInventory(a, this.economy, dt);
        if (a.carriedGrain >= a.carryCapacity - 0.01 || this.economy.fieldGrain <= 0) this.sendToBarn(unit);
        else if (a.hunger >= 0.82) this.sendToBarn(unit, 'eat');
        else if (a.fatigue >= 0.88) this.sendToRest(unit);
      } else if (a.task === 'eating') {
        eatFromStore(a, this.economy, dt, rationCost(a, this.politics));
        if (a.hunger <= 0.18 || this.economy.grain <= 0) {
          if (a.fatigue >= 0.7) this.sendToRest(unit);
          else if (unit.assignedHarvest && this.economy.fieldGrain > 0 && !shouldRefuseWork(a)) this.sendToField(unit);
          else a.task = shouldRefuseWork(a) ? 'refusing' : 'idle';
        }
      } else if (a.task === 'resting') {
        rest(a, dt);
        if (a.fatigue <= 0.2) {
          if (a.hunger >= 0.55 && this.economy.grain > 0) this.sendToBarn(unit, 'eat');
          else if (unit.assignedHarvest && this.economy.fieldGrain > 0 && !shouldRefuseWork(a)) this.sendToField(unit);
          else a.task = shouldRefuseWork(a) ? 'refusing' : 'idle';
        }
      } else if (a.task === 'protesting') {
        idleRecovery(a, dt);
        if (!shouldProtest(a, this.politics) && a.grievance < 0.52) a.task = 'idle';
      } else {
        idleRecovery(a, dt);
      }

      unit.status.setText(this.statusLine(a));
    }

    this.grainText.setText(`BARN GRAIN: ${this.economy.grain.toFixed(1)}`);
    this.fieldText.setText(`FIELD GRAIN: ${this.economy.fieldGrain.toFixed(1)}`);
    this.politicsText.setText(`UNREST: ${Math.round(this.politics.unrest * 100)}%`);
    this.rationButton.setText(`RATIONS: ${this.politics.rationPolicy === 'equal' ? 'EQUAL' : 'PIGS + DOGS FIRST'}`);
    this.refreshSelectionInfo();
  }

  private drawFarm() {
    const g = this.add.graphics();
    g.fillStyle(0x2a321b, 1).fillRect(0, 0, 960, 640);
    g.fillStyle(0x554522, 1).fillRect(this.wheatZone.x, this.wheatZone.y, this.wheatZone.width, this.wheatZone.height);
    g.fillStyle(0x4a331f, 1).fillRect(this.barnZone.x, this.barnZone.y, this.barnZone.width, this.barnZone.height);
    g.fillStyle(0x3e2e1d, 1).fillRect(680, 110, 190, 140);
    g.fillStyle(0x6a552e, 1).fillRect(700, 130, 150, 100);
    g.fillStyle(0x263b22, 1).fillRect(70, 355, 390, 190);
    g.fillStyle(0x2f2b25, 1).fillRect(this.restZone.x, this.restZone.y, this.restZone.width, this.restZone.height);
    g.fillStyle(0x49251f, 0.85).fillRect(this.protestZone.x, this.protestZone.y, this.protestZone.width, this.protestZone.height);
    g.fillStyle(0x23384a, 1).fillCircle(790, 480, 65);

    this.add.text(95, 94, 'WHEAT FIELD', { color: '#d9c98d', fontSize: '16px' });
    this.add.text(95, 115, 'Right-click to assign harvest', { color: '#c8b887', fontSize: '11px' });
    this.add.text(520, 145, 'BARN', { color: '#e9d29b', fontSize: '16px' });
    this.add.text(509, 166, 'grain / food', { color: '#c5bda8', fontSize: '11px' });
    this.add.text(715, 148, 'FARMHOUSE', { color: '#e9e3d3', fontSize: '16px' });
    this.add.text(95, 370, 'PASTURE', { color: '#d9c98d', fontSize: '16px' });
    this.add.text(530, 390, 'REST YARD', { color: '#d0c7b6', fontSize: '14px' });
    this.add.text(700, 325, 'PROTEST YARD', { color: '#f09a82', fontSize: '14px' });
    this.add.text(742, 470, 'WATER', { color: '#d5e1e8', fontSize: '16px' });
    this.add.text(20, 15, 'FOLWARK RTS — economy creates politics', { color: '#e9e3d3', fontSize: '15px' });
  }

  private createHud() {
    this.grainText = this.add.text(690, 20, '', { color: '#f1d36d', fontSize: '14px' });
    this.fieldText = this.add.text(690, 40, '', { color: '#d9c98d', fontSize: '13px' });
    this.politicsText = this.add.text(690, 60, '', { color: '#ef8f79', fontSize: '13px' });
    this.rationButton = this.add.text(690, 82, '', {
      color: '#f4d783', fontSize: '12px', backgroundColor: '#24180dcc', padding: { x: 8, y: 5 },
    }).setInteractive({ useHandCursor: true });
    this.rationButton.on('pointerdown', () => {
      this.politics.rationPolicy = this.politics.rationPolicy === 'equal' ? 'privileged' : 'equal';
    });

    this.infoText = this.add.text(610, 535, 'Select an animal.', {
      color: '#e9e3d3', fontSize: '12px', lineSpacing: 3, backgroundColor: '#161109cc', padding: { x: 10, y: 8 },
    });
  }

  private spawnDemoAnimals() {
    const demo = [
      createAnimal({ id: 'boxer', name: 'Boxer', species: 'horse', strength: 0.95, loyalty: 0.9, courage: 0.55, carryCapacity: 14, x: 240, y: 360 }),
      createAnimal({ id: 'napoleon', name: 'Napoleon', species: 'pig', ambition: 0.95, voice: 0.85, carryCapacity: 6, x: 710, y: 285 }),
      createAnimal({ id: 'bluebell', name: 'Bluebell', species: 'dog', courage: 0.8, loyalty: 0.72, carryCapacity: 7, x: 770, y: 300 }),
      createAnimal({ id: 'clover', name: 'Clover', species: 'horse', strength: 0.82, loyalty: 0.64, courage: 0.7, grievance: 0.22, carryCapacity: 12, x: 285, y: 390 }),
    ];
    for (const state of demo) this.createUnit(state);
  }

  private createUnit(state: AnimalState) {
    const colorBySpecies: Record<AnimalState['species'], number> = {
      pig: 0xc78983, dog: 0x777777, horse: 0x8b5a35, cow: 0xded6c8, sheep: 0xeee8da, hen: 0xb95b35,
    };
    const ring = this.add.circle(0, 0, 19).setStrokeStyle(2, 0xd9a441).setVisible(false);
    const bodyShape = this.add.circle(0, 0, 13, colorBySpecies[state.species]);
    const label = this.add.text(0, 20, state.name, { color: '#f2ead6', fontSize: '12px' }).setOrigin(0.5, 0);
    const status = this.add.text(0, 34, this.statusLine(state), { color: '#c5bda8', fontSize: '9px' }).setOrigin(0.5, 0);
    const body = this.add.container(state.x, state.y, [ring, bodyShape, label, status]);
    body.setSize(56, 54).setInteractive({ useHandCursor: true });
    const unit: Unit = { state, body, ring, status, assignedHarvest: false };
    body.on('pointerdown', (pointer: Phaser.Input.Pointer) => { if (pointer.leftButtonDown()) this.selectOnly(unit); });
    this.units.push(unit);
  }

  private selectOnly(unit: Unit) {
    for (const current of this.selected) current.ring.setVisible(false);
    this.selected = [unit];
    unit.ring.setVisible(true);
    this.refreshSelectionInfo();
  }

  private issueMove(x: number, y: number) {
    this.selected.forEach((unit, index) => {
      unit.assignedHarvest = false;
      this.moveUnit(unit, x + (index % 3) * 28, y + Math.floor(index / 3) * 28, 'idle');
    });
  }

  private issueHarvestOrder() {
    this.selected.forEach((unit) => {
      if (shouldRefuseWork(unit.state)) { unit.state.task = 'refusing'; return; }
      unit.assignedHarvest = true;
      this.sendToField(unit);
    });
  }

  private sendToField(unit: Unit) {
    if (!unit.assignedHarvest || this.economy.fieldGrain <= 0 || shouldRefuseWork(unit.state)) {
      unit.state.task = shouldRefuseWork(unit.state) ? 'refusing' : 'idle';
      return;
    }
    const index = this.units.indexOf(unit);
    const tx = this.wheatZone.centerX + ((index % 3) - 1) * 50;
    const ty = this.wheatZone.centerY + Math.floor((index % 6) / 3) * 42;
    this.moveUnit(unit, tx, ty, 'harvest');
  }

  private sendToBarn(unit: Unit, purpose: 'deposit' | 'eat' = 'deposit') {
    const tx = this.barnZone.centerX;
    const ty = this.barnZone.centerY;
    this.moveUnit(unit, tx, ty, purpose === 'eat' ? 'eating' : 'idle', () => {
      depositGrain(unit.state, this.economy);
      if (purpose === 'eat' || unit.state.hunger >= 0.72) unit.state.task = 'eating';
      else if (unit.state.fatigue >= 0.82) this.sendToRest(unit);
      else if (unit.assignedHarvest && this.economy.fieldGrain > 0 && !shouldRefuseWork(unit.state)) this.sendToField(unit);
    });
  }

  private sendToRest(unit: Unit) {
    this.moveUnit(unit, this.restZone.centerX, this.restZone.centerY, 'resting');
  }

  private sendToProtest(unit: Unit) {
    const i = this.units.indexOf(unit);
    const tx = this.protestZone.x + 30 + (i % 3) * 45;
    const ty = this.protestZone.y + 35 + Math.floor((i % 6) / 3) * 28;
    this.moveUnit(unit, tx, ty, 'protesting');
  }

  private moveUnit(unit: Unit, x: number, y: number, onArrivalTask: AnimalState['task'], afterArrival?: () => void) {
    this.tweens.killTweensOf(unit.body);
    unit.state.task = unit.state.carriedGrain > 0 ? 'hauling' : 'moving';
    this.tweens.add({
      targets: unit.body, x, y,
      duration: Math.max(120, Phaser.Math.Distance.Between(unit.body.x, unit.body.y, x, y) * 3),
      ease: 'Linear',
      onComplete: () => {
        unit.state.x = x; unit.state.y = y; unit.state.task = onArrivalTask; afterArrival?.();
      },
    });
  }

  private statusLine(state: AnimalState) {
    const carry = state.carriedGrain > 0.05 ? ` · G ${state.carriedGrain.toFixed(1)}/${state.carryCapacity}` : '';
    return `${state.task.toUpperCase()} · H ${Math.round(state.hunger * 100)} · F ${Math.round(state.fatigue * 100)} · Gv ${Math.round(state.grievance * 100)}${carry}`;
  }

  private refreshSelectionInfo() {
    const unit = this.selected[0];
    if (!unit) return;
    const a = unit.state;
    this.infoText.setText([
      `${a.name.toUpperCase()} · ${a.species}`,
      `Task: ${a.task}`,
      `Assigned: ${unit.assignedHarvest ? 'harvest' : 'none'}`,
      `Health: ${Math.round(a.health * 100)}`,
      `Hunger: ${Math.round(a.hunger * 100)}`,
      `Fatigue: ${Math.round(a.fatigue * 100)}`,
      `Loyalty: ${Math.round(a.loyalty * 100)}`,
      `Grievance: ${Math.round(a.grievance * 100)}`,
      `Rations: ${this.politics.rationPolicy}`,
    ]);
  }
}
