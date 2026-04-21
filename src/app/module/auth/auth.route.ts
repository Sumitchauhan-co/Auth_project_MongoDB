import express from 'express';
import authController from './auth.controller.js';
import { authenticate, forgotPasswordLimiter, validate } from './auth.middleware.js';
import { loginSchema, registerSchema } from './auth.schema.js';

const router = express.Router();

// routes

router.post('/register', validate(registerSchema), authController.register);

router.post('/login', validate(loginSchema), authController.login);

router.post('/logout', authenticate, authController.logout);

router.post('/refresh', authController.refresh);

router.get('/profile/:id', authenticate, authController.profile);

router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);

router.post('/reset-password', authController.resetPassword);

export default router;
