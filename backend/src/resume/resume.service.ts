import * as ResumeRepository from './resume.repository';
import { Resume } from './resume.type';

export const getResume = (): Promise<Resume> => {
  return ResumeRepository.findResume();
};
