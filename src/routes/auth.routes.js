import express from "express";
import {
  getCurrentUser,
  isAuthenticated,
  loginUser,
  logoutUser,
  registerUser,
  resetPassword,
  sendResetPasswordOTP,
  sendVerifyEmailOTP,
  verifyEmailOTP,
} from "../controllers/auth.controller.js";
import authUser from "../middleware/authUser.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/logout", logoutUser);
userRouter.get("/profile",authUser, getCurrentUser);
userRouter.get("/is-authenticated", authUser, isAuthenticated)
userRouter.get("/send-verify-otp", authUser, sendVerifyEmailOTP);
userRouter.get("/verify-otp", authUser, verifyEmailOTP);
userRouter.get("/send-reset-password-otp", authUser, sendResetPasswordOTP);
userRouter.get("/reset-password", authUser, resetPassword);


export default userRouter;