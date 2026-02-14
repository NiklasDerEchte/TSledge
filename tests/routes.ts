import { Router } from 'express';
import fluentRouter  from './fluent-api';
import authRouter from './auth';

const router = Router();

router.use('/fluent', fluentRouter);
router.use('/auth', authRouter);

export default router;