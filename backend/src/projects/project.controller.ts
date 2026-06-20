import { Request, Response, NextFunction } from 'express';
import { ProjectService } from './project.service';
import { sendSuccess } from '../utils/response.util';
import { randomUUID } from 'crypto';

export const createProjectController = (service: ProjectService) => ({
  getAll: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projects = await service.getAll();
      sendSuccess(res, projects);
    } catch (err) {
      next(err);
    }
  },

  insert: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const project = await service.insert({ ...req.body, id: randomUUID() });
      sendSuccess(res, project, 201);
    } catch (err) {
      next(err);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const project = await service.update(req.params.id, req.body);
      if (!project) {
        res.status(404).json({ success: false, message: 'Project not found' });
        return;
      }
      sendSuccess(res, project);
    } catch (err) {
      next(err);
    }
  },

  remove: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deleted = await service.deleteById(req.params.id);
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Project not found' });
        return;
      }
      sendSuccess(res, null);
    } catch (err) {
      next(err);
    }
  },
});
