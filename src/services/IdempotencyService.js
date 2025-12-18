import * as repo from '../repositories/IdempotencyRepo.js';

export const checkIdempotency = async (key) => {
  return await repo.getIdempotencyKey(key);
};

export const lockIdempotencyKey = async (key) => {
  return await repo.createIdempotencyLock(key);
};

export const saveIdempotencyResult = async (key, code, body) => {
  return await repo.completeIdempotencyKey(key, code, body);
};