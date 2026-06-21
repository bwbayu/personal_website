import { About } from './about.type';
import { AboutRepository } from './about.repository';

export const createAboutService = (repo: AboutRepository) => ({
  get: (): Promise<About | null> => repo.findOne(),

  insert: (data: About): Promise<About> => repo.save(data),

  update: (id: string, data: Partial<About>): Promise<About | null> => repo.update(id, data),

  deleteById: (id: string): Promise<boolean> => repo.remove(id),
});

export type AboutService = ReturnType<typeof createAboutService>;
