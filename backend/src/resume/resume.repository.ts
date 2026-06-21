import { Resume } from './resume.type';
import { createEducationRepository } from '../educations/education.repository';
import { createExperienceRepository } from '../experiences/experience.repository';
import { createCertificationRepository } from '../certifications/certification.repository';
import { createAchievementRepository } from '../achievements/achievements.repository';

const educationRepo = createEducationRepository();
const experienceRepo = createExperienceRepository();
const certificationRepo = createCertificationRepository();
const achievementRepo = createAchievementRepository();

export const findResume = async (): Promise<Resume> => {
  const results = await Promise.allSettled([
    educationRepo.findAll(),
    experienceRepo.findAll(),
    certificationRepo.findAll(),
    achievementRepo.findAll(),
  ]);

  return {
    educations: results[0].status === 'fulfilled' ? results[0].value : [],
    experiences: results[1].status === 'fulfilled' ? results[1].value : [],
    certifications: results[2].status === 'fulfilled' ? results[2].value : [],
    achievements: results[3].status === 'fulfilled' ? results[3].value : [],
  };
};
