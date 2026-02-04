import express from 'express';
import cors from 'cors';
import * as core from 'express-serve-static-core';
import { errorLogger, requestLogger } from './middleware';

/**
 * Creates and configures an Express application.
 * @example
 * ```typescript
 * const app = tsledge.createApp();
 * app.listen(PORT, () => {
 *   console.log(`Server running on port ${PORT}`);
 * });
 * ```
 * @returns {core.Express} The configured Express application.
 */
export function createApp(): core.Express {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);
  app.use(errorLogger);
  return app;
}
