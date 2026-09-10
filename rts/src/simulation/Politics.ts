import type { AnimalState } from './Animal';

export type RationPolicy = 'equal' | 'privileged';

export interface PoliticsState {
  rationPolicy: RationPolicy;
  unrest: number;
}

export const createPolitics = (): PoliticsState => ({
  rationPolicy: 'equal',
  unrest: 0,
});

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function isPrivileged(animal: AnimalState): boolean {
  return animal.species === 'pig' || animal.species === 'dog';
}

export function rationCost(animal: AnimalState, politics: PoliticsState): number {
  if (politics.rationPolicy === 'equal') return 1;
  return isPrivileged(animal) ? 1.25 : 0.7;
}

export function applyPoliticalPressure(
  animal: AnimalState,
  politics: PoliticsState,
  deltaSeconds: number,
): void {
  const hungerPressure = Math.max(0, animal.hunger - 0.5);
  const fatiguePressure = Math.max(0, animal.fatigue - 0.65);
  const deprivedByPolicy = politics.rationPolicy === 'privileged' && !isPrivileged(animal) ? 1 : 0;
  const privilegedBenefit = politics.rationPolicy === 'privileged' && isPrivileged(animal) ? 1 : 0;

  animal.grievance = clamp01(
    animal.grievance +
      hungerPressure * 0.018 * deltaSeconds +
      fatiguePressure * 0.012 * deltaSeconds +
      deprivedByPolicy * 0.004 * deltaSeconds -
      privilegedBenefit * 0.002 * deltaSeconds,
  );

  animal.loyalty = clamp01(
    animal.loyalty -
      hungerPressure * 0.012 * deltaSeconds -
      fatiguePressure * 0.006 * deltaSeconds -
      deprivedByPolicy * 0.0025 * deltaSeconds +
      privilegedBenefit * 0.0015 * deltaSeconds,
  );

  if (animal.hunger > 0.92) {
    animal.health = clamp01(animal.health - 0.018 * deltaSeconds);
  } else if (animal.hunger < 0.35 && animal.fatigue < 0.5) {
    animal.health = clamp01(animal.health + 0.003 * deltaSeconds);
  }
}

export function updateUnrest(animals: AnimalState[], politics: PoliticsState): void {
  if (!animals.length) {
    politics.unrest = 0;
    return;
  }

  politics.unrest = animals.reduce((sum, a) => {
    const courageFactor = 0.55 + a.courage * 0.45;
    const fearSuppression = 1 - a.fear * 0.65;
    return sum + a.grievance * courageFactor * fearSuppression;
  }, 0) / animals.length;
}

export function shouldRefuseWork(animal: AnimalState): boolean {
  return animal.grievance > 0.62 && animal.loyalty < 0.5 && animal.fear < 0.72;
}

export function shouldProtest(animal: AnimalState, politics: PoliticsState): boolean {
  const personal = animal.grievance * (0.65 + animal.courage * 0.35) - animal.fear * 0.3;
  return personal > 0.58 && politics.unrest > 0.38;
}
