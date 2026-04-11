import express from "express";
import authRouter from "./auth/auth.route.js"
import cookieParser from "cookie-parser"

export const app = express()

// middlewares

app.use(express.json())
app.use(cookieParser())

// routes

app.use("/api/auth", authRouter)

