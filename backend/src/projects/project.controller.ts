import { Request, Response, NextFunction } from 'express';
import * as ProjectService from './project.service';
import { sendSuccess } from '../utils/response.util';
import { randomUUID } from 'crypto';

export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const projects = await ProjectService.getAll();
    sendSuccess(res, projects);
  } catch (err) {
    next(err);
  }
};

export const insert = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const project = await ProjectService.insert({ ...req.body, id: randomUUID() });
    sendSuccess(res, project, 201);
  } catch (err) {
    next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const project = await ProjectService.update(req.params.id, req.body);
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }
    sendSuccess(res, project);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const deleted = await ProjectService.deleteById(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }
    sendSuccess(res, null);
  } catch (err) {
    next(err);
  }
};
