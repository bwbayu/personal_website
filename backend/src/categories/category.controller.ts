import { Request, Response, NextFunction } from 'express';
import { CategoryService } from './category.service';
import { sendSuccess } from '../utils/response.util';
import { toSlug } from '../utils/slug.util';

export const createCategoryController = (service: CategoryService) => ({
  getAll: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await service.getAll();
      sendSuccess(res, categories);
    } catch (err) {
      next(err);
    }
  },

  insert: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await service.insert({ ...req.body, id: toSlug(req.body.name) });
      sendSuccess(res, category, 201);
    } catch (err) {
      next(err);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await service.update(req.params.id, req.body);
      if (!category) {
        res.status(404).json({ success: false, message: 'Category not found' });
        return;
      }
      sendSuccess(res, category);
    } catch (err) {
      next(err);
    }
  },

  remove: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deleted = await service.deleteById(req.params.id);
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Category not found' });
        return;
      }
      sendSuccess(res, null);
    } catch (err) {
      next(err);
    }
  },

  reorder: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await service.reorder(req.body);
      if (!result.ok) {
        res.status(404).json({ success: false, message: 'Unknown id(s): ' + result.missing.join(', ') });
        return;
      }
      sendSuccess(res, null);
    } catch (err) {
      next(err);
    }
  },
});
