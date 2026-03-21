import { Education } from '../educations/education.type';
import { Experience } from '../experiences/experience.type';
import { Certification } from '../certifications/certification.type';
import { Achievement } from '../achievements/achievements.type';

export interface Resume {
  educations: Education[];
  experiences: Experience[];
  certifications: Certification[];
  achievements: Achievement[];
}
