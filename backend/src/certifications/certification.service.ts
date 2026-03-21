import * as CertificationRepository from './certification.repository';
import { Certification } from './certification.type';

export const getAll = (): Promise<Certification[]> => {
  return CertificationRepository.findAll();
};

export const insert = (data: Certification): Promise<Certification> => {
  return CertificationRepository.save(data);
};

export const update = (id: string, data: Partial<Certification>): Promise<Certification | null> => {
  return CertificationRepository.update(id, data);
};

export const deleteById = (id: string): Promise<boolean> => {
  return CertificationRepository.remove(id);
};
