import { Resume } from './resume.type';
import * as EducationRepository from '../educations/education.repository';
import { createExperienceRepository } from '../experiences/experience.repository';
import * as CertificationRepository from '../certifications/certification.repository';
import * as AchievementRepository from '../achievements/achievements.repository';

const experienceRepo = createExperienceRepository();

export const findResume = async (): Promise<Resume> => {
  const results = await Promise.allSettled([
    EducationRepository.findAll(),
    experienceRepo.findAll(),
    CertificationRepository.findAll(),
    AchievementRepository.findAll(),
  ]);

  return {
    educations: results[0].status === 'fulfilled' ? results[0].value : [],
    experiences: results[1].status === 'fulfilled' ? results[1].value : [],
    certifications: results[2].status === 'fulfilled' ? results[2].value : [],
    achievements: results[3].status === 'fulfilled' ? results[3].value : [],
  };
};
