import apiError from '../../common/utils/apiError.js';
import {
    generateAccessToken,
    generateHashedToken,
    generateRefreshToken,
    generateResetToken,
    verifyRefreshToken,
} from './utils/jwt.js';
import Auth from './auth.model.js';
import type { User } from './types/auth.js';
import type { AuthMiddlewareResponse } from './auth.middleware.js';
import { transporter } from './utils/mail.js';
import nodemailer from 'nodemailer';

export const registerService = async ({
    firstName,
    lastName,
    email,
    password,
}: User) => {
    const existingUser = await Auth.findOne({ email });

    if (existingUser) {
        throw apiError.conflict('User already exists');
    }

    const user = await Auth.create({
        firstName,
        lastName,
        email,
        password, // (hashed)
    });

    const refreshToken = await generateRefreshToken({
        id: user._id,
        role: user.role,
    });

    const accessToken = await generateAccessToken({
        id: user._id,
        role: user.role,
    });

    user.refreshToken = refreshToken;

    await user.save();

    return { user, accessToken };
};

export const loginService = async ({
    email,
    password,
}: {
    email: string;
    password: string;
}) => {
    const user = await Auth.findOne({ email }).select('+password');

    if (!user) {
        throw apiError.notFound('Invalid user');
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
        throw apiError.badRequest('Incorrect email or password');
    }

    const accessToken = await generateAccessToken({
        id: user._id,
        role: user.role,
    });

    const refreshToken = await generateRefreshToken({
        id: user._id,
        role: user.role,
    });

    user.refreshToken = refreshToken;

    await user.save();

    return { user, accessToken };
};

export const logoutService = async (user: AuthMiddlewareResponse) => {
    await Auth.findByIdAndUpdate(user._id, { refreshToken: null });
    return user;
};

export const refreshService = async (refreshToken: string) => {
    const decoded = (await verifyRefreshToken(refreshToken)) as {
        id: string;
        role: string;
    };

    if (!decoded.id) {
        throw apiError.unauthorized('Invalid refresh token');
    }

    const user = await Auth.findById(decoded.id);

    if (!user) {
        throw apiError.notFound('User not found');
    }

    const accessToken = await generateAccessToken({
        id: user._id,
        role: user.role,
    });

    return { user, accessToken };
};

export const profileService = async (id: string) => {
    const user = await Auth.findById(id);

    if (!user) {
        throw apiError.notFound('User not found');
    }

    return user;
};

export const forgotPasswordService = async (email: string) => {
    const user = await Auth.findOne({ email })

    if (!user) {
        throw apiError.badRequest('Invalid email');
    }

    const { resetToken, hashedToken } = await generateResetToken();

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await user.save();

    const resetURL = `${process.env.BASE_URL}/reset-password?token=${resetToken}`;

    // nodemailer logic

    try {
        const info = await transporter.sendMail({
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Reset your password',
            html: `<p>You can reset your password from the link : <a href="${resetURL}">Reset Pasword</a></p><br><p><b>NOTE : </b>Link is active for only 5 minutes of span.</p>`,
        });

        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    } catch (err) {
        console.error('Error while sending mail:', err);
    }

    return;
};

export const resetPasswordService = async ({
    token,
    newPassword,
}: {
    token: string;
    newPassword: string;
}) => {
    const hashedToken = await generateHashedToken(token);

    const user = await Auth.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpiry: { $gt: new Date() },
    }).select('+password');

    if (!user) {
        throw apiError.badRequest('Invalid or expired token');
    }

    user.password = newPassword;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;

    await user.save();

    return user;
};
