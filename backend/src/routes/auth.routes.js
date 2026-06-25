import {Router} from 'express';
import {getCurrentUser, login} from '../controllers/auth.controller.js';
import {requireAuth} from '../middleware/auth.middleware.js';

export const authRouter = Router();

authRouter.post('/login', login);
authRouter.get('/me', requireAuth, getCurrentUser);