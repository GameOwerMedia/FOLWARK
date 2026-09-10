import Phaser from 'phaser';
import { AnimalState, createAnimal } from '../simulation/Animal';

type Unit = {
  state: AnimalState;
  body: Phaser.GameObjects.Container;
  ring: Phaser.GameObjects.Arc;
};

export class FarmScene extends Phaser.Scene {
  private units: Unit[] = [];
  private selected: Unit[] = [];

  constructor() {
    super('FarmScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#171208');
    this.drawFarm();
    this.spawnDemoAnimals();

    this.input.mouse?.disableContextMenu();
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        this.issueMove(pointer.worldX, pointer.worldY);
      }
    });
  }

  private drawFarm() {
    const g = this.add.graphics();
    g.fillStyle(0x2a321b, 1).fillRect(0, 0, 960, 640);
    g.fillStyle(0x554522, 1).fillRect(70, 80, 330, 210);
    g.fillStyle(0x3e2e1d, 1).fillRect(640, 110, 190, 140);
    g.fillStyle(0x6a552e, 1).fillRect(660, 130, 150, 100);
    g.fillStyle(0x263b22, 1).fillRect(70, 355, 390, 190);
    g.fillStyle(0x23384a, 1).fillCircle(760, 450, 65);

    this.add.text(95, 94, 'WHEAT FIELD', { color: '#d9c98d', fontSize: '16px' });
    this.add.text(675, 148, 'FARMHOUSE', { color: '#e9e3d3', fontSize: '16px' });
    this.add.text(95, 370, 'PASTURE', { color: '#d9c98d', fontSize: '16px' });
    this.add.text(712, 440, 'WATER', { color: '#d5e1e8', fontSize: '16px' });
    this.add.text(20, 15, 'FOLWARK RTS PROTOTYPE — click unit, right-click to move', {
      color: '#e9e3d3',
      fontSize: '15px',
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
    const body = this.add.container(state.x, state.y, [ring, bodyShape, label]);
    body.setSize(38, 38).setInteractive({ useHandCursor: true });

    const unit: Unit = { state, body, ring };
    body.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) this.selectOnly(unit);
    });
    this.units.push(unit);
  }

  private selectOnly(unit: Unit) {
    for (const current of this.selected) current.ring.setVisible(false);
    this.selected = [unit];
    unit.ring.setVisible(true);
  }

  private issueMove(x: number, y: number) {
    this.selected.forEach((unit, index) => {
      const offsetX = (index % 3) * 28;
      const offsetY = Math.floor(index / 3) * 28;
      const tx = x + offsetX;
      const ty = y + offsetY;
      this.tweens.add({
        targets: unit.body,
        x: tx,
        y: ty,
        duration: Phaser.Math.Distance.Between(unit.body.x, unit.body.y, tx, ty) * 3,
        ease: 'Linear',
        onComplete: () => {
          unit.state.x = tx;
          unit.state.y = ty;
        },
      });
    });
  }
}
