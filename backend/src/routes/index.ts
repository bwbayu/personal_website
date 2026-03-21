import { Router } from 'express';
import projectRoutes from '../projects/project.routes';
import experienceRoutes from '../experiences/experience.routes';
import skillRoutes from '../skills/skill.routes';
import resumeRoutes from '../resume/resume.routes';
import aboutRoutes from '../about/about.routes';
import achievementRoutes from '../achievements/achievements.routes';
import certificationRoutes from '../certifications/certification.routes';
import educationRoutes from '../educations/education.routes';
import mediaSocialRoutes from '../mediaSocials/mediaSocial.routes';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ success: true, message: 'API is running' });
});

router.use('/projects', projectRoutes);
router.use('/experiences', experienceRoutes);
router.use('/skills', skillRoutes);
router.use('/resume', resumeRoutes);
router.use('/about', aboutRoutes);
router.use('/achievements', achievementRoutes);
router.use('/certifications', certificationRoutes);
router.use('/educations', educationRoutes);
router.use('/media-socials', mediaSocialRoutes);

export default router;
