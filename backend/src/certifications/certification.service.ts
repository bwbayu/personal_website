import { Certification } from './certification.type';
import { CertificationRepository } from './certification.repository';

export const createCertificationService = (repo: CertificationRepository) => ({
  getAll: (): Promise<Certification[]> => repo.findAll(),

  insert: (data: Certification): Promise<Certification> => repo.save(data),

  update: (id: string, data: Partial<Certification>): Promise<Certification | null> => repo.update(id, data),

  deleteById: (id: string): Promise<boolean> => repo.remove(id),
});

export type CertificationService = ReturnType<typeof createCertificationService>;
