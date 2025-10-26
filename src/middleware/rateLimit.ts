import rateLimit from 'express-rate-limit';

import { fail } from '../utils/response';

export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 120, // Limit each IP to 120 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
  handler: (_req, res) => {
    res.status(429).json(fail('Too many requests', 'RATE_LIMITED'));
  },
});
