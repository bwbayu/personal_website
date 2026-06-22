import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';
import { sendSuccess } from '../utils/response.util';

// Domain-agnostic rebuild trigger: proxies a GitHub workflow_dispatch on the
// frontend-deploy workflow so a static-export rebuild can be kicked off from the
// admin UI. The GitHub token lives only in BE config and never reaches the browser.
export const createRebuildController = () => ({
  trigger: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { githubDispatchToken, githubRepo, githubWorkflowFile, githubWorkflowRef } = config;

      if (!githubDispatchToken || !githubRepo) {
        res.status(503).json({ success: false, message: 'Rebuild not configured' });
        return;
      }

      const url = `https://api.github.com/repos/${githubRepo}/actions/workflows/${githubWorkflowFile}/dispatches`;
      const ghRes = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${githubDispatchToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ref: githubWorkflowRef }),
      });

      // GitHub returns 204 No Content on a successful dispatch.
      if (ghRes.status !== 204) {
        next(Object.assign(new Error('GitHub dispatch failed'), { status: 502 }));
        return;
      }

      sendSuccess(res, null, 202);
    } catch (err) {
      next(err);
    }
  },
});
