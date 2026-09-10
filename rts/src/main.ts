import Phaser from 'phaser';
import { FarmScene } from './game/FarmScene';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: 960,
  height: 640,
  backgroundColor: '#0b0a08',
  scene: [FarmScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
});
