// Custome throttler decorator

import { Throttle } from '@nestjs/throttler';

// Strict rate for auth, payments
export const StrictThrottle = () =>
  Throttle({
    default: {
      ttl: 60,
      limit: 3,
    },
  });

// Moderate rate for orders
export const ModerateThrottle = () =>
  Throttle({
    default: {
      ttl: 60,
      limit: 15,
    },
  });

// Relaxed rate for read-operations
export const RelaxedThrottle = () =>
  Throttle({
    default: {
      ttl: 60,
      limit: 35,
    },
  });
