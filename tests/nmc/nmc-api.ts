import express, { Request, Response } from 'express';
import { fileURLToPath } from 'url';
import { join } from 'path';
import * as nmc from './niklas-module-config';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const config = nmc.parseNmcFile('public/example.nmc');
    res.status(200).json(config);
  } catch (e) {
    console.log(e);
    res.status(500).json();
  }
});

export default router;
