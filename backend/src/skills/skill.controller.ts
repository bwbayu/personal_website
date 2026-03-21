import { Request, Response, NextFunction } from 'express';
import * as SkillService from './skill.service';
import { sendSuccess } from '../utils/response.util';
import { toSlug } from '../utils/slug.util';

export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const skills = await SkillService.getAll();
    sendSuccess(res, skills);
  } catch (err) {
    next(err);
  }
};

export const insert = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const skill = await SkillService.insert({ ...req.body, id: toSlug(req.body.name) });
    sendSuccess(res, skill, 201);
  } catch (err) {
    next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const skill = await SkillService.update(req.params.id, req.body);
    if (!skill) {
      res.status(404).json({ success: false, message: 'Skill not found' });
      return;
    }
    sendSuccess(res, skill);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const deleted = await SkillService.deleteById(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Skill not found' });
      return;
    }
    sendSuccess(res, null);
  } catch (err) {
    next(err);
  }
};
