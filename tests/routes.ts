import { Router } from 'express';
import fluentRouter  from './fluent-api';

const router = Router();

router.use('/fluent', fluentRouter);

export default router;