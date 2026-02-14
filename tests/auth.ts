import express from 'express';
import { jwtRequired, login, logout, refreshJWT, register } from '../src';

const router = express.Router();

// TODO Testen und wie kann ich hier custom User daten injecten?
router.post('/register', register, async (req: any, res: any) => {
  res.status(200).json({});
});

router.post('/login', login, async (req: any, res: any) => {
  res.status(200).json(res.locals.credentials);
});

router.post('/logout', logout, async (req: any, res: any) => {
  res.status(200).json({});
});

router.post('/refresh', refreshJWT, async (req: any, res: any) => {
  res.status(200).json({});
});

router.get('/secure', jwtRequired, async (req: any, res: any) => {
  res.status(200).json({});
});

export default router;