import type { JwtUser } from './jwt';

export {}; // ensures this file is a module

declare global {
  namespace Express {
    interface Request {
      user?: JwtUser;
    }
  }
}
