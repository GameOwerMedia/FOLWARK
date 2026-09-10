import type { AnimalState } from './Animal';

export interface EconomyState {
  grain: number;
  fieldGrain: number;
}

export const createEconomy = (): EconomyState => ({
  grain: 20,
  fieldGrain: 120,
});

export function harvestGrain(
  animal: AnimalState,
  economy: EconomyState,
  deltaSeconds: number,
): number {
  if (animal.task !== 'harvest' || economy.fieldGrain <= 0) return 0;

  const fatiguePenalty = 1 - Math.min(0.75, animal.fatigue * 0.7);
  const hungerPenalty = 1 - Math.min(0.7, animal.hunger * 0.6);
  const speciesBonus = animal.species === 'horse' ? 1.35 : 1;
  const ratePerSecond = (0.7 + animal.strength * 1.1) * speciesBonus * fatiguePenalty * hungerPenalty;
  const harvested = Math.min(economy.fieldGrain, ratePerSecond * deltaSeconds);

  economy.fieldGrain -= harvested;
  economy.grain += harvested;
  animal.fatigue = Math.min(1, animal.fatigue + 0.018 * deltaSeconds);
  animal.hunger = Math.min(1, animal.hunger + 0.009 * deltaSeconds);

  if (animal.fatigue > 0.92 || animal.hunger > 0.94 || economy.fieldGrain <= 0) {
    animal.task = 'idle';
  }

  return harvested;
}

export function idleRecovery(animal: AnimalState, deltaSeconds: number): void {
  if (animal.task !== 'idle') return;
  animal.fatigue = Math.max(0, animal.fatigue - 0.01 * deltaSeconds);
  animal.hunger = Math.min(1, animal.hunger + 0.0025 * deltaSeconds);
}
