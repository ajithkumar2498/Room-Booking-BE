import { IdempotencyKey } from '../models/index.js';

export const getIdempotencyKey = async (key) => {
  return await IdempotencyKey.findByPk(key);
};

export const createIdempotencyLock = async (key) => {
  try {
    await IdempotencyKey.create({ key, locked: 1 });
    return true;
  } catch (e) {
    return false;
  }
};

export const completeIdempotencyKey = async (key, code, body) => {
  const record = await IdempotencyKey.findByPk(key);
  if (record) {
    record.responseCode = code;
    record.responseBody = JSON.stringify(body);
    record.locked = 0;
    await record.save();
  }
};