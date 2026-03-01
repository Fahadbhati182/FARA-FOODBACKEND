import { sendEmail } from "../lib/nodemailer.js";
import User from "../models/User.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import AsynHandler from "../utils/AsynHandler.js";

export const registerUser = AsynHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new ApiError(400, "Please fill all the fields");
  }

  const exitingUser = await User.findOne({ email });

  if (exitingUser) {
    res.status(400);
    throw new ApiError(400, "User already exists");
  }

  const hashPassword = await User.hashPassword(password);
  const user = await User.create({
    name,
    email,
    password: hashPassword,
  });

  if (!user) {
    res.status(500);
    throw new ApiError(500, "Something went wrong");
  }

  res
    .status(201)
    .json(new ApiResponse(201, "User registered successfully", user));
});

export const loginUser = AsynHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new ApiError(400, "Please fill all the fields");
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    res.status(400);
    throw new ApiError(400, "Invalid credentials");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    res.status(400);
    throw new ApiError(400, "Invalid credentials");
  }

  const token = user.generateJWTToken();

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res
    .status(200)
    .json(new ApiResponse(200, "Logged in successfully", { token }));
});

export const logoutUser = AsynHandler(async (req, res) => {
  res.clearCookie("token");
  res.status(200).json(new ApiResponse(200, "Logged out successfully", null));
});

export const getCurrentUser = AsynHandler(async (req, res) => {
  const { userId: loginUserId } = req.user;
  const user = await User.findById(loginUserId);

  if (!user) {
    res.status(404);
    throw new ApiError(404, "User not found");
  }

  res.status(200).json(new ApiResponse(200, "User fetched successfully", user));
});

export const isAuthenticated = AsynHandler(async (req, res) => {
  const { userId: loginUserId } = req.user;
  if (!loginUserId) {
    res.status(401);
    throw new ApiError(401, "Unauthorized");
  }

  res.status(200).json(new ApiResponse(200, "User is authenticated", null));
});

export const sendVerifyEmailOTP = AsynHandler(async (req, res) => {
  const { userId: loginUserId } = req.user;

  if (!loginUserId) {
    res.status(401);
    throw new ApiError(401, "Unauthorized");
  }

  const user = await User.findById(loginUserId);

  if (!user) {
    res.status(404);
    throw new ApiError(404, "User not found");
  }

  if (user.isVerified) {
    res.status(400);
    throw new ApiError(400, "Email is already verified");
  }

  const OTP = crypto.randomInt(100000, 999999).toString();
  user.otp = OTP;
  user.otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes

  await user.save();

  sendEmail(
    user.email,
    "Verify your email",
    `
    Your OTP for email verification is: ${OTP}
    
    This OTP is valid for 5 minutes.
      `,
  );

  res.status(200).json(new ApiResponse(200, "OTP sent successfully", null));
});

export const verifyEmailOTP = AsynHandler(async (req, res) => {
  const { userId: loginUserId } = req.user;
  const { otp } = req.body;

  if (!loginUserId) {
    res.status(401);
    throw new ApiError(401, "Unauthorized");
  }

  const user = await User.findById(loginUserId).select("+otp +otpExpiry");

  if (!user) {
    res.status(404);
    throw new ApiError(404, "User not found");
  }

  if (user.isVerified) {
    res.status(400);
    throw new ApiError(400, "Email is already verified");
  }

  if (user.otp !== otp || user.otpExpiry < Date.now()) {
    res.status(400);
    throw new ApiError(400, "Invalid or expired OTP");
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  res
    .status(200)
    .json(new ApiResponse(200, "Email verified successfully", null));
});

export const sendResetPasswordOTP = AsynHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new ApiError(400, "Please provide an email");
  }

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new ApiError(404, "User not found");
  }

  const OTP = crypto.randomInt(100000, 999999).toString();
  user.resetPasswordOtp = OTP;
  user.resetPasswordOtpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes

  await user.save();
  sendEmail(
    user.email,
    "Reset your password",
    `
    Your OTP for password reset is: ${OTP}
    This OTP is valid for 5 minutes.
      `,
  );
  res.status(200).json(new ApiResponse(200, "OTP sent successfully", null));
});

export const resetPassword = AsynHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    res.status(400);
    throw new ApiError(400, "Please fill all the fields");
  }

  const user = await User.findOne({ email }).select(
    "+resetPasswordOtp +resetPasswordOtpExpiry",
  );

  if (!user) {
    res.status(404);
    throw new ApiError(404, "User not found");
  }

  if (
    user.resetPasswordOtp !== otp ||
    user.resetPasswordOtpExpiry < Date.now()
  ) {
    res.status(400);
    throw new ApiError(400, "Invalid or expired OTP");
  }

  user.password = await User.hashPassword(newPassword);
  user.resetPasswordOtp = undefined;
  user.resetPasswordOtpExpiry = undefined;
  await user.save();

  res
    .status(200)
    .json(new ApiResponse(200, "Password reset successfully", null));
});


