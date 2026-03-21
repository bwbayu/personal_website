import * as AchievementRepository from './achievements.repository';
import { Achievement } from './achievements.type';

export const getAll = (): Promise<Achievement[]> => {
  return AchievementRepository.findAll();
};

export const insert = (data: Achievement): Promise<Achievement> => {
  return AchievementRepository.save(data);
};

export const update = (id: string, data: Partial<Achievement>): Promise<Achievement | null> => {
  return AchievementRepository.update(id, data);
};

export const deleteById = (id: string): Promise<boolean> => {
  return AchievementRepository.remove(id);
};
