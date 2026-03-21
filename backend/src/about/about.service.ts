import * as AboutRepository from './about.repository';
import { About } from './about.type';

export const get = (): Promise<About | null> => {
  return AboutRepository.findOne();
};

export const insert = (data: About): Promise<About> => {
  return AboutRepository.save(data);
};

export const update = (id: string, data: Partial<About>): Promise<About | null> => {
  return AboutRepository.update(id, data);
};

export const deleteById = (id: string): Promise<boolean> => {
  return AboutRepository.remove(id);
};
