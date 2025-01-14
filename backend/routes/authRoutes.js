import express from "express";
import {
  login,
  logout,
  signup,
  verifyEmail,
  forgotPassword,
  resetPassword,
  checkAuth,
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
const router = express.Router();

router.get("/check-auth", verifyToken, checkAuth); //check if the user is authenticated

router.post("/signup", signup); //signup route
router.post("/login", login); //login route
router.post("/logout", logout); //logout route

router.post("/verify-email", verifyEmail); //verify email route
router.post("/forgot-password", forgotPassword); //forgot password route
router.post("/reset-password/:token", resetPassword); //reset password route with token

export default router;
