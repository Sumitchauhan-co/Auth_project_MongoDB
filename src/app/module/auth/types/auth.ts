import { Model } from 'mongoose';


// for decleration of auth model
export interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    refreshToken?: string;
    resetPasswordToken?: string | undefined;
    resetPasswordExpiry?: Date | undefined;
    role: 'user' | 'admin';
}

export interface UserMethods {
    comparePassword(userPassword: string): Promise<boolean>;
}

export type UserModel = Model<User, {}, UserMethods>;

// added more Request decleration for authenticate middleware
declare global {
    namespace Express {
        interface Request {
            user?: {
                _id: string;
                role: string;
                email: string;
            };
        }
    }
}
