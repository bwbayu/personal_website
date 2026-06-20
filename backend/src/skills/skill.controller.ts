import { Request, Response, NextFunction } from 'express';
import { SkillService } from './skill.service';
import { sendSuccess } from '../utils/response.util';
import { toSlug } from '../utils/slug.util';

export const createSkillController = (service: SkillService) => ({
  getAll: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const skills = await service.getAll();
      sendSuccess(res, skills);
    } catch (err) {
      next(err);
    }
  },

  insert: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const skill = await service.insert({ ...req.body, id: toSlug(req.body.name) });
      sendSuccess(res, skill, 201);
    } catch (err) {
      next(err);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const skill = await service.update(req.params.id, req.body);
      if (!skill) {
        res.status(404).json({ success: false, message: 'Skill not found' });
        return;
      }
      sendSuccess(res, skill);
    } catch (err) {
      next(err);
    }
  },

  remove: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deleted = await service.deleteById(req.params.id);
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Skill not found' });
        return;
      }
      sendSuccess(res, null);
    } catch (err) {
      next(err);
    }
  },
});
