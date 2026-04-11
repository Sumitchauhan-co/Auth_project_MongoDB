import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import type { User, UserModel, UserMethods } from './types/auth.js';

const authSchema = new mongoose.Schema<User, UserModel, UserMethods>(
    {
        firstName: {
            type: String,
            required: [true, 'First name is required'],
            maxLength: [255, 'First name max length limit is reached'],
        },
        lastName: {
            type: String,
            maxLength: [255, 'Last name max length limit is reached'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            maxLength: [255, 'Email max length limit is reached'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            select: false,
            maxLength: [255, 'Password max length limit is reached'],
        },
        role: {
            type: String,
            required: [true, 'Role is required'],
            enum: {
                values: ['user', 'admin'],
                message: `Invalid role`,
            },
            default: 'user',
        },
        refreshToken: {
            type: String,
            select: false,
        },
        resetPasswordToken: {
            type: String,
            select: false,
        },
        resetPasswordExpiry: {
            type: Date,
            select: false,
        },
    },
    { timestamps: true },
);

authSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

authSchema.methods.comparePassword = async function (userPassword: string) {
    return await bcrypt.compare(userPassword, this.password);
};

const Auth = mongoose.model('Auth', authSchema);

export default Auth;
