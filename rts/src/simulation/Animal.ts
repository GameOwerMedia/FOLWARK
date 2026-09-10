export type Species = 'pig' | 'dog' | 'horse' | 'cow' | 'sheep' | 'hen';
export type AnimalTask = 'idle' | 'moving' | 'harvest' | 'hauling' | 'eating' | 'resting';

export interface AnimalState {
  id: string;
  name: string;
  species: Species;
  age: number;
  strength: number;
  health: number;
  hunger: number;
  fear: number;
  loyalty: number;
  grievance: number;
  courage: number;
  docility: number;
  ambition: number;
  voice: number;
  fatigue: number;
  task: AnimalTask;
  carriedGrain: number;
  carryCapacity: number;
  x: number;
  y: number;
}

export const createAnimal = (input: Partial<AnimalState> & Pick<AnimalState, 'id' | 'name' | 'species'>): AnimalState => ({
  age: 3,
  strength: 0.5,
  health: 1,
  hunger: 0.15,
  fear: 0.1,
  loyalty: 0.65,
  grievance: 0.1,
  courage: 0.5,
  docility: 0.5,
  ambition: 0.4,
  voice: 0.4,
  fatigue: 0,
  task: 'idle',
  carriedGrain: 0,
  carryCapacity: 8,
  x: 0,
  y: 0,
  ...input,
});
