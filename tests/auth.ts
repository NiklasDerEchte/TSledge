import express, { Response } from 'express';
import {
  JWTCredentials,
  jwtRequired,
  authLogin,
  authLogout,
  authRefresh,
  authRegister,
  AuthUserDocument,
} from '../src/index';

const router = express.Router();

// TODO Testen und wie kann ich hier custom User daten injecten?
router.post(
  '/register',
  authRegister,
  async (req: any, res: Response & { locals: { authUser: AuthUserDocument } }) => {
    res.locals.authUser.save();
    res.status(200).json({});
  }
);

router.post('/login', authLogin, async (req: any, res: Response & { locals: { credentials: JWTCredentials } }) => {
  // Here the appUser in credentials can be modified with other data
  res.status(200).json(res.locals.credentials);
});

router.post('/logout', authLogout, async (req: any, res: any) => {
  res.status(200).json({});
});

router.post('/refresh', authRefresh, async (req: any, res: any) => {
  res.status(200).json({});
});

router.get('/secure', jwtRequired, async (req: any, res: any) => {
  res.status(200).json({});
});

export default router;