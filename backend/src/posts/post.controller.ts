import { Request, Response, NextFunction } from 'express';
import { PostService } from './post.service';
import { sendSuccess } from '../utils/response.util';
import { randomUUID } from 'crypto';

export const createPostController = (service: PostService) => ({
  // Public: published posts only.
  getAll: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const posts = await service.getPublished();
      sendSuccess(res, posts);
    } catch (err) {
      next(err);
    }
  },

  // Authed (admin): all statuses, including drafts.
  getAllAdmin: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const posts = await service.getAllAdmin();
      sendSuccess(res, posts);
    } catch (err) {
      next(err);
    }
  },

  insert: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const post = await service.insert({ ...req.body, id: randomUUID() });
      sendSuccess(res, post, 201);
    } catch (err) {
      next(err);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const post = await service.update(req.params.id, req.body);
      if (!post) {
        res.status(404).json({ success: false, message: 'Post not found' });
        return;
      }
      sendSuccess(res, post);
    } catch (err) {
      next(err);
    }
  },

  remove: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deleted = await service.deleteById(req.params.id);
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Post not found' });
        return;
      }
      sendSuccess(res, null);
    } catch (err) {
      next(err);
    }
  },
});
