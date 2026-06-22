import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { createRebuildController } from '../../src/rebuild/rebuild.controller';
import { config } from '../../src/config/env';

// Unit test: stub global fetch and toggle the GitHub config on the shared config
// object. No real network, no Firestore.
const makeRes = () => {
  const res = {} as Record<string, ReturnType<typeof vi.fn>> & Response;
  res.status = vi.fn(() => res) as never;
  res.json = vi.fn(() => res) as never;
  return res as Response & { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> };
};

const controller = createRebuildController();

describe('rebuild controller', () => {
  const saved = {
    token: config.githubDispatchToken,
    repo: config.githubRepo,
    file: config.githubWorkflowFile,
    ref: config.githubWorkflowRef,
  };

  beforeEach(() => {
    config.githubDispatchToken = 'ghp_test_token';
    config.githubRepo = 'bwbayu/personal-website';
    config.githubWorkflowFile = 'frontend-deploy.yml';
    config.githubWorkflowRef = 'main';
  });

  afterEach(() => {
    config.githubDispatchToken = saved.token;
    config.githubRepo = saved.repo;
    config.githubWorkflowFile = saved.file;
    config.githubWorkflowRef = saved.ref;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('dispatches to the correct GitHub URL/headers/body and returns 202 on a 204', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ status: 204 });
    vi.stubGlobal('fetch', fetchMock);

    const res = makeRes();
    const next = vi.fn() as NextFunction;
    await controller.trigger({} as Request, res, next);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      'https://api.github.com/repos/bwbayu/personal-website/actions/workflows/frontend-deploy.yml/dispatches',
    );
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer ghp_test_token');
    expect(init.headers.Accept).toBe('application/vnd.github+json');
    expect(init.headers['X-GitHub-Api-Version']).toBe('2022-11-28');
    expect(JSON.parse(init.body)).toEqual({ ref: 'main' });

    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: null });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 503 (and does not call fetch) when token/repo are unset', async () => {
    config.githubDispatchToken = undefined;
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const res = makeRes();
    const next = vi.fn() as NextFunction;
    await controller.trigger({} as Request, res, next);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Rebuild not configured' });
  });

  it('forwards a 502 when GitHub responds with a non-204', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 422 }));

    const res = makeRes();
    const next = vi.fn() as NextFunction;
    await controller.trigger({} as Request, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
    expect((next as ReturnType<typeof vi.fn>).mock.calls[0][0]).toMatchObject({ status: 502 });
  });
});
