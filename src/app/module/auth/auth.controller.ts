import type { Request, Response } from 'express';
import {
    loginService,
    logoutService,
    profileService,
    refreshService,
    registerService,
    forgotPasswordService,
    resetPasswordService,
    verifyEmailService,
} from './auth.service.js';
import apiResponse from '../../common/utils/apiResponse.js';
import apiError from '../../common/utils/apiError.js';
import type { CookieOptions } from 'express';

const register = async (req: Request, res: Response) => {
    const { accessToken, user } = await registerService(req.body);

    const cookieOptions: CookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
    };

    res.cookie('refreshToken', user.refreshToken, cookieOptions);

    return apiResponse.created(res, 'User is registered successfully', {
        accessToken,
        user,
    });
};

const login = async (req: Request, res: Response) => {
    const { accessToken, user } = await loginService(req.body);

    const cookieOptions: CookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
    };

    res.cookie('refreshToken', user.refreshToken, cookieOptions);

    return apiResponse.ok(res, 'User logged in successfully', {
        accessToken,
        user,
    });
};

const logout = async (req: Request, res: Response) => {
    const user = await logoutService(req.user!);

    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
    });

    return apiResponse.ok(res, 'User logged out successfully', user);
};

const refresh = async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
        throw apiError.unauthorized('Refresh token is absent');
    }

    const { accessToken, user } = await refreshService(refreshToken);

    return apiResponse.ok(res, 'Token refreshed successfully', {
        accessToken,
        user,
    });
};

export const profile = async (req: Request, res: Response) => {
    const id = req.params.id;
    const userId = req.user?._id;

    if (userId !== id) {
        throw apiError.unauthorized('Unauthorized action');
    }

    if (!id || Array.isArray(id)) {
        throw apiError.notFound('Profile not found');
    }

    const user = await profileService(id);

    return apiResponse.ok(res, 'User profile fetched successfully', { user });
};

const forgotPassword = async (req: Request, res: Response) => {
    const email = req.body.email;

    if (!email) {
        throw apiError.notFound('Email not found');
    }

    await forgotPasswordService(email);

    return apiResponse.ok(
        res,
        'Email sent successfully to the existing account',
    );
};

const resetPassword = async (req: Request, res: Response) => {
    const { newPassword, confirmPassword } = req.body;
    const token = req.query.token as string;

    if (newPassword !== confirmPassword) {
        throw apiError.badRequest('Password incorrect');
    }

    if (!token || Array.isArray(token)) {
        throw apiError.unauthorized('Invalid token');
    }

    const user = await resetPasswordService({ token, newPassword });

    return apiResponse.ok(res, 'Password reset successfully', { user });
};

const verifyEmail = async (req: Request, res: Response) => {
    const token = req.query.token as string;

    if (!token || Array.isArray(token)) {
        throw apiError.unauthorized('Invalid token');
    }

    const user = await verifyEmailService(token);

    return apiResponse.ok(res, 'Email verified successfully', { user });
};

export default {
    register,
    login,
    logout,
    refresh,
    profile,
    forgotPassword,
    resetPassword,
};
