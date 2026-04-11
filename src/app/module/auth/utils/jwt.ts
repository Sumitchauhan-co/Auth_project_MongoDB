import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import crypto from "crypto"

export const generateRefreshToken = async (payload: JwtPayload) => {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET!, {
        expiresIn: (process.env.REFRESH_TOKEN_EXPIRY || '15m') as any,
    });
};

export const generateAccessToken = async (payload: JwtPayload) => {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET!, {
        expiresIn: (process.env.ACCESS_TOKEN_EXPIRY || '1h') as any,
    });
};

export const verifyAccessToken = async (token: string) => {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!)
}

export const verifyRefreshToken = async (token: string) => {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!)
}

export const generateResetToken = async () => {
    const resetToken= crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    return {resetToken, hashedToken}
}

export const generateHashedToken = async (token: string) => {
    return crypto.createHash('sha256').update(token).digest('hex')
}
