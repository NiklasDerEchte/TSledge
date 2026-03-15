import { Router } from 'express';
import fluentRouter  from './fluent-api';
import authRouter from './auth';
import icecatRouter from './icecat-api';
import nmcRouter from './nmc/routes';

const router = Router();

router.use('/fluent', fluentRouter);
router.use('/auth', authRouter);
router.use('/icecat', icecatRouter);
router.use('/nmc', nmcRouter);

export default router;