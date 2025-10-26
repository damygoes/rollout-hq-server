import jwt from 'jsonwebtoken';

import { ENV } from '../../config/env';

import type { Secret, SignOptions } from 'jsonwebtoken';

const EXPIRE = 7 * 24 * 60 * 60; // 7 days in seconds

export function signJwt(payload: object, expiresIn = EXPIRE) {
  const secret: Secret = ENV.JWT_SECRET;
  const options: SignOptions = { expiresIn };
  return jwt.sign(payload, secret, options);
}
