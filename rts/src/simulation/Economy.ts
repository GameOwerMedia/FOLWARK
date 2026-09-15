import type { AnimalState } from './Animal';

export interface EconomyState {
  grain: number;
  fieldGrain: number;
}

export const createEconomy = (): EconomyState => ({
  grain: 20,
  fieldGrain: 120,
});

export function harvestToInventory(
  animal: AnimalState,
  economy: EconomyState,
  deltaSeconds: number,
  productivity = 1,
): number {
  if (animal.task !== 'harvest' || economy.fieldGrain <= 0) return 0;
  const remainingCapacity = Math.max(0, animal.carryCapacity - animal.carriedGrain);
  if (remainingCapacity <= 0) return 0;

  const fatiguePenalty = 1 - Math.min(0.75, animal.fatigue * 0.7);
  const hungerPenalty = 1 - Math.min(0.7, animal.hunger * 0.6);
  const speciesBonus = animal.species === 'horse' ? 1.35 : 1;
  const ratePerSecond = (0.7 + animal.strength * 1.1) * speciesBonus * fatiguePenalty * hungerPenalty;
  const harvested = Math.min(economy.fieldGrain, remainingCapacity, ratePerSecond * deltaSeconds * productivity);

  economy.fieldGrain -= harvested;
  animal.carriedGrain += harvested;
  animal.fatigue = Math.min(1, animal.fatigue + 0.018 * deltaSeconds);
  animal.hunger = Math.min(1, animal.hunger + 0.009 * deltaSeconds);
  return harvested;
}

export function depositGrain(animal: AnimalState, economy: EconomyState): number {
  const deposited = animal.carriedGrain;
  if (deposited <= 0) return 0;
  economy.grain += deposited;
  animal.carriedGrain = 0;
  return deposited;
}

export function eatFromStore(
  animal: AnimalState,
  economy: EconomyState,
  deltaSeconds: number,
  rationMultiplier = 1,
): number {
  if (animal.task !== 'eating' || economy.grain <= 0 || animal.hunger <= 0.08) return 0;
  const baseRate = animal.species === 'horse' || animal.species === 'cow' ? 0.85 : 0.45;
  const eatRate = baseRate * rationMultiplier;
  const consumed = Math.min(economy.grain, eatRate * deltaSeconds);
  economy.grain -= consumed;
  animal.hunger = Math.max(0, animal.hunger - consumed * 0.22);
  return consumed;
}

export function rest(animal: AnimalState, deltaSeconds: number): void {
  if (animal.task !== 'resting') return;
  animal.fatigue = Math.max(0, animal.fatigue - 0.05 * deltaSeconds);
  animal.hunger = Math.min(1, animal.hunger + 0.003 * deltaSeconds);
}

export function idleRecovery(animal: AnimalState, deltaSeconds: number): void {
  if (animal.task !== 'idle' && animal.task !== 'refusing' && animal.task !== 'protesting') return;
  animal.fatigue = Math.max(0, animal.fatigue - 0.01 * deltaSeconds);
  animal.hunger = Math.min(1, animal.hunger + 0.0025 * deltaSeconds);
}
