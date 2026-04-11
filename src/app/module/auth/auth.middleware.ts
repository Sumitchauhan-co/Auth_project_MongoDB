import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import apiError from '../../common/utils/apiError.js';
import Auth from './auth.model.js';
import { verifyAccessToken } from './utils/jwt.js';
import rateLimit from 'express-rate-limit';

export interface AuthMiddlewareResponse {
    _id: string;
    role: string;
    email: string;
}

export const validate =
    (schema: z.ZodType) =>
    async (req: Request, res: Response, next: NextFunction) => {
        const result = await schema.safeParseAsync(req.body);

        if (result.error) {
            throw apiError.badRequest('Validation error', result.error.issues);
        }

        req.body = result.data;
        next();
    };

export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const header = req.headers['authorization'];

        if (!header || !header?.startsWith('Bearer ')) {
            throw apiError.badRequest('Invalid authorization header');
        }

        const token = header.split(' ')[1];

        if (!token) {
            throw apiError.unauthorized('Not authorized for the action');
        }

        const decoded = (await verifyAccessToken(token)) as {
            id: string;
            role: string;
        };

        const user = await Auth.findById(decoded.id).select('_id role email');

        if (!user) {
            throw apiError.unauthorized('User no longer exists');
        }

        req.user = {
            _id: user._id,
            role: user.role,
            email: user.email,
        };

        next();
    } catch (error) {
        next(apiError.unauthorized('Invalid or expired token'));
    }
};

export const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: {
        message: 'Too many password reset attempts! Try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
