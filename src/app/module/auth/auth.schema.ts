import z from "zod";

export const registerSchema = z.object({
    firstName: z.string().min(1).max(255),
    lastName: z.string().max(255).optional(),
    email: z.email().min(8).max(255).transform(val => val.toLowerCase().trim()),
    password: z.string().min(6).max(255),
    role: z.enum(["user", "admin"]).optional(),
})

export const loginSchema = z.object({
    email: z.email().min(8).max(255).transform(val => val.toLowerCase().trim()),
    password: z.string().min(6).max(255),
})