import { Router } from 'express';
import * as ResumeController from './resume.controller';

const router = Router();

router.get('/', ResumeController.getResume);

export default router;
