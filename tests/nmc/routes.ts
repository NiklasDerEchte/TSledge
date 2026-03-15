import { Router } from 'express';
import nmcRouter from './nmc-api';

const router = Router();

router.use('/', nmcRouter);

export default router;
