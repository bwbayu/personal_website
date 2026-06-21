import { Achievement } from './achievements.type';
import { AchievementRepository } from './achievements.repository';

export const createAchievementService = (repo: AchievementRepository) => ({
  getAll: (): Promise<Achievement[]> => repo.findAll(),

  insert: (data: Achievement): Promise<Achievement> => repo.save(data),

  update: (id: string, data: Partial<Achievement>): Promise<Achievement | null> => repo.update(id, data),

  deleteById: (id: string): Promise<boolean> => repo.remove(id),
});

export type AchievementService = ReturnType<typeof createAchievementService>;
