import * as MediaSocialRepository from './mediaSocial.repository';
import { MediaSocial } from './mediaSocial.type';

export const getAll = (): Promise<MediaSocial[]> => {
  return MediaSocialRepository.findAll();
};

export const insert = (data: MediaSocial): Promise<MediaSocial> => {
  return MediaSocialRepository.save(data);
};

export const update = (id: string, data: Partial<MediaSocial>): Promise<MediaSocial | null> => {
  return MediaSocialRepository.update(id, data);
};

export const deleteById = (id: string): Promise<boolean> => {
  return MediaSocialRepository.remove(id);
};
