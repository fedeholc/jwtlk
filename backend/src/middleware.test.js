import { describe, it, expect, beforeEach, vi } from 'vitest';
import { extractToken, verifyAccessToken } from './middleware';
import { jwtVerify } from 'jose';

vi.mock('jose');

describe('extractToken', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    next = vi.fn();
  });

  it('should extract token from authorization header', () => {
    req.headers['authorization'] = 'Bearer testtoken';
    extractToken(req, res, next);
    expect(req.token).toBe('testtoken');
    expect(next).toHaveBeenCalled();
  });

  it('should return 401 if authorization header is missing', () => {
    extractToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('should return 401 if token is empty', () => {
    req.headers['authorization'] = 'Bearer ';
    extractToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('should return 500 if an error occurs', () => {
    req.headers['authorization'] = 'Bearer testtoken';
    const error = new Error('Test error');
    next.mockImplementationOnce(() => { throw error; });
    extractToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: `Internal Server Error: ${error.message}` });
  });
});

describe('verifyAccessToken', () => {
  let req, res, next, accessSecretKey, middleware;

  beforeEach(() => {
    req = {
      token: 'testtoken',
      body: {}
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    next = vi.fn();
    accessSecretKey = new Uint8Array([1, 2, 3, 4]);
    middleware = verifyAccessToken(accessSecretKey);
  });

  it('should verify token and add payload to request body', async () => {
    const payload = { userId: "123" };
    //@ts-ignore
    jwtVerify.mockResolvedValueOnce({ payload });

    await middleware(req, res, next);

    expect(jwtVerify).toHaveBeenCalledWith("testtoken", accessSecretKey);
    expect(req.body.payload).toEqual(payload);
    expect(next).toHaveBeenCalled();
  });

  it('should return 401 if token is not found', async () => {
    req.token = undefined;

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token not found.' });
  });

  it('should return 401 if token is invalid', async () => {
    const error = new Error('Invalid token');
    //@ts-ignore
    jwtVerify.mockRejectedValueOnce(error);

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: `Invalid Token: ${error}` });
  });
});
