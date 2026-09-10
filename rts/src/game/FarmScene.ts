import Phaser from 'phaser';
import { AnimalState, createAnimal } from '../simulation/Animal';
import { createEconomy, harvestGrain, idleRecovery } from '../simulation/Economy';

type Unit = {
  state: AnimalState;
  body: Phaser.GameObjects.Container;
  ring: Phaser.GameObjects.Arc;
  status: Phaser.GameObjects.Text;
};

export class FarmScene extends Phaser.Scene {
  private units: Unit[] = [];
  private selected: Unit[] = [];
  private economy = createEconomy();
  private grainText!: Phaser.GameObjects.Text;
  private fieldText!: Phaser.GameObjects.Text;
  private infoText!: Phaser.GameObjects.Text;
  private wheatZone = new Phaser.Geom.Rectangle(70, 80, 330, 210);

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

      if (Phaser.Geom.Rectangle.Contains(this.wheatZone, pointer.worldX, pointer.worldY)) {
        this.issueHarvestOrder();
      } else {
        this.issueMove(pointer.worldX, pointer.worldY);
      }
    });
  }

  update(_time: number, deltaMs: number) {
    const dt = Math.min(deltaMs / 1000, 0.1);

    for (const unit of this.units) {
      if (unit.state.task === 'harvest') harvestGrain(unit.state, this.economy, dt);
      else idleRecovery(unit.state, dt);
      unit.status.setText(this.statusLine(unit.state));
    }

    this.grainText.setText(`GRAIN STORE: ${this.economy.grain.toFixed(1)}`);
    this.fieldText.setText(`FIELD: ${this.economy.fieldGrain.toFixed(1)}`);
    this.refreshSelectionInfo();
  }

  private drawFarm() {
    const g = this.add.graphics();
    g.fillStyle(0x2a321b, 1).fillRect(0, 0, 960, 640);
    g.fillStyle(0x554522, 1).fillRect(this.wheatZone.x, this.wheatZone.y, this.wheatZone.width, this.wheatZone.height);
    g.fillStyle(0x3e2e1d, 1).fillRect(640, 110, 190, 140);
    g.fillStyle(0x6a552e, 1).fillRect(660, 130, 150, 100);
    g.fillStyle(0x263b22, 1).fillRect(70, 355, 390, 190);
    g.fillStyle(0x23384a, 1).fillCircle(760, 450, 65);

    this.add.text(95, 94, 'WHEAT FIELD', { color: '#d9c98d', fontSize: '16px' });
    this.add.text(95, 115, 'Right-click here to order selected animals to harvest', { color: '#c8b887', fontSize: '11px' });
    this.add.text(675, 148, 'FARMHOUSE', { color: '#e9e3d3', fontSize: '16px' });
    this.add.text(95, 370, 'PASTURE', { color: '#d9c98d', fontSize: '16px' });
    this.add.text(712, 440, 'WATER', { color: '#d5e1e8', fontSize: '16px' });
    this.add.text(20, 15, 'FOLWARK RTS — click unit · right-click ground to move · right-click wheat to harvest', {
      color: '#e9e3d3',
      fontSize: '15px',
    });
  }

  private createHud() {
    this.grainText = this.add.text(690, 20, '', { color: '#f1d36d', fontSize: '14px' });
    this.fieldText = this.add.text(690, 40, '', { color: '#d9c98d', fontSize: '13px' });
    this.infoText = this.add.text(610, 540, 'Select an animal.', {
      color: '#e9e3d3',
      fontSize: '12px',
      lineSpacing: 4,
      backgroundColor: '#161109cc',
      padding: { x: 10, y: 8 },
    });
  }

  private spawnDemoAnimals() {
    const demo = [
      createAnimal({ id: 'boxer', name: 'Boxer', species: 'horse', strength: 0.95, loyalty: 0.9, x: 240, y: 360 }),
      createAnimal({ id: 'napoleon', name: 'Napoleon', species: 'pig', ambition: 0.95, voice: 0.85, x: 710, y: 285 }),
      createAnimal({ id: 'bluebell', name: 'Bluebell', species: 'dog', courage: 0.8, loyalty: 0.72, x: 770, y: 300 }),
    ];

    for (const state of demo) this.createUnit(state);
  }

  private createUnit(state: AnimalState) {
    const colorBySpecies: Record<AnimalState['species'], number> = {
      pig: 0xc78983,
      dog: 0x777777,
      horse: 0x8b5a35,
      cow: 0xded6c8,
      sheep: 0xeee8da,
      hen: 0xb95b35,
    };

    const ring = this.add.circle(0, 0, 19).setStrokeStyle(2, 0xd9a441).setVisible(false);
    const bodyShape = this.add.circle(0, 0, 13, colorBySpecies[state.species]);
    const label = this.add.text(0, 20, state.name, { color: '#f2ead6', fontSize: '12px' }).setOrigin(0.5, 0);
    const status = this.add.text(0, 34, this.statusLine(state), { color: '#c5bda8', fontSize: '9px' }).setOrigin(0.5, 0);
    const body = this.add.container(state.x, state.y, [ring, bodyShape, label, status]);
    body.setSize(42, 48).setInteractive({ useHandCursor: true });

    const unit: Unit = { state, body, ring, status };
    body.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) this.selectOnly(unit);
    });
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
      unit.state.task = 'moving';
      this.tweens.killTweensOf(unit.body);

      const offsetX = (index % 3) * 28;
      const offsetY = Math.floor(index / 3) * 28;
      const tx = x + offsetX;
      const ty = y + offsetY;

      this.tweens.add({
        targets: unit.body,
        x: tx,
        y: ty,
        duration: Math.max(120, Phaser.Math.Distance.Between(unit.body.x, unit.body.y, tx, ty) * 3),
        ease: 'Linear',
        onComplete: () => {
          unit.state.x = tx;
          unit.state.y = ty;
          unit.state.task = 'idle';
        },
      });
    });
  }

  private issueHarvestOrder() {
    this.selected.forEach((unit, index) => {
      this.tweens.killTweensOf(unit.body);
      unit.state.task = 'moving';

      const tx = this.wheatZone.centerX + ((index % 3) - 1) * 42;
      const ty = this.wheatZone.centerY + Math.floor(index / 3) * 38;

      this.tweens.add({
        targets: unit.body,
        x: tx,
        y: ty,
        duration: Math.max(120, Phaser.Math.Distance.Between(unit.body.x, unit.body.y, tx, ty) * 3),
        ease: 'Linear',
        onComplete: () => {
          unit.state.x = tx;
          unit.state.y = ty;
          unit.state.task = this.economy.fieldGrain > 0 ? 'harvest' : 'idle';
        },
      });
    });
  }

  private statusLine(state: AnimalState) {
    return `${state.task.toUpperCase()} · H ${Math.round(state.hunger * 100)} · F ${Math.round(state.fatigue * 100)}`;
  }

  private refreshSelectionInfo() {
    const unit = this.selected[0];
    if (!unit) return;

    const a = unit.state;
    this.infoText.setText([
      `${a.name.toUpperCase()} · ${a.species}`,
      `Task: ${a.task}`,
      `Strength: ${Math.round(a.strength * 100)}`,
      `Hunger: ${Math.round(a.hunger * 100)}`,
      `Fatigue: ${Math.round(a.fatigue * 100)}`,
      `Loyalty: ${Math.round(a.loyalty * 100)}`,
      `Grievance: ${Math.round(a.grievance * 100)}`,
    ]);
  }
}
