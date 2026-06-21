import { MediaSocial } from './mediaSocial.type';
import { MediaSocialRepository } from './mediaSocial.repository';

export const createMediaSocialService = (repo: MediaSocialRepository) => ({
  getAll: (): Promise<MediaSocial[]> => repo.findAll(),

  insert: (data: MediaSocial): Promise<MediaSocial> => repo.save(data),

  update: (id: string, data: Partial<MediaSocial>): Promise<MediaSocial | null> => repo.update(id, data),

  deleteById: (id: string): Promise<boolean> => repo.remove(id),
});

export type MediaSocialService = ReturnType<typeof createMediaSocialService>;
