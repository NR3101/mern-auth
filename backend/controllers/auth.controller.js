import User from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import crypto from "crypto";
import { generateVerificationToken } from "../utils/generateVerificationToken.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import {
  sendPasswordResetEmail,
  sendPasswordResetSuccessEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "../mailtrap/emails.js";

//signup controller to create a new user
export const signup = async (req, res) => {
  const { name, email, password } = req.body; //get name, email and password from request body
  try {
    //if name, email or password is missing, throw an error
    if (!name || !email || !password) {
      throw new Error("All fields are required");
    }

    //check if user already exists with the email and throw an error if user already exists
    const userAlreadyExists = await User.findOne({ email });
    if (userAlreadyExists) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    //hash the password using bcryptjs
    const hashedPassword = await bcryptjs.hash(password, 10);
    //generate a verification code for user to verify their email
    const verificationToken = generateVerificationToken();

    //create a new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      verificationToken,
      verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000, //expires in 24 hours
    });

    //save the user to the database
    await user.save();

    // create a jwt token and set it as a cookie in the response
    generateTokenAndSetCookie(res, user._id);

    //send a verification email to the user
    await sendVerificationEmail(user.email, verificationToken);

    //send a response with the user details
    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        ...user._doc,
        password: undefined, //do not send the password in the response
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

//verify email controller to verify the email of the user
export const verifyEmail = async (req, res) => {
  const { code } = req.body; //get the verification code from the request body

  try {
    const user = await User.findOne({
      verificationToken: code,
      verificationTokenExpiresAt: { $gt: Date.now() }, //check if the verification token is not expired
    });

    //if user is not found, throw an error
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    //update the user to set the email as verified
    user.isVerified = true;
    //remove the verification token and expiry date
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;

    await user.save(); //save the user

    await sendWelcomeEmail(user.email, user.name); //send a welcome email to the user

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      user: {
        ...user._doc,
        password: undefined, //do not send the password in the response
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

//login controller to login the user
export const login = async (req, res) => {
  const { email, password } = req.body; //get email and password from request body

  try {
    const user = await User.findOne({ email }); //find the user with the email

    //if user is not found, throw an error
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email or password" });
    }

    //check if the password is correct
    const isPasswordCorrect = await bcryptjs.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email or password" });
    }

    //generate a jwt token and set it as a cookie in the response
    generateTokenAndSetCookie(res, user._id);

    user.lastLogin = new Date(); //update the last login date of the user
    await user.save(); //save the user

    //send a response with the user details
    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user: {
        ...user._doc,
        password: undefined, //do not send the password in the response
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

//logout controller to logout the user
export const logout = async (req, res) => {
  res.clearCookie("token"); //clear the token cookie

  res.status(200).json({ success: true, message: "Logged out successfully" });
};

//forgot password controller to send a password reset link to the user
export const forgotPassword = async (req, res) => {
  const { email } = req.body; //get email from request body

  try {
    const user = await User.findOne({ email }); //find the user with the email

    //if user is not found, throw an error
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    //generate a password reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000; //expires in 1 hour

    user.resetPasswordToken = resetToken; //set the reset token
    user.resetPasswordExpiresAt = resetTokenExpiresAt; //set the expiry date

    await user.save(); //save the user

    //send a password reset email to the user with the reset link
    await sendPasswordResetEmail(
      user.email,
      `${process.env.CLIENT_URL}/reset-password/${resetToken}`
    );

    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

//reset password controller to reset the password of the user
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params; //get the reset token from the request params
    const { password } = req.body; //get the new password from the request body

    // find the user with the reset token and check if the token is not expired
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiresAt: { $gt: Date.now() },
    });

    //if user is not found, throw an error
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset token" });
    }

    //update the password of the user
    const hashedPassword = await bcryptjs.hash(password, 10); //hash the new password
    user.password = hashedPassword; //set the new password
    user.resetPasswordToken = undefined; //remove the reset token
    user.resetPasswordExpiresAt = undefined; //remove the expiry date

    await user.save(); //save the user

    //send a password reset success email to the user
    await sendPasswordResetSuccessEmail(user.email);

    //send a response with the success message
    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

//check auth controller to check if the user is authenticated
export const checkAuth = async (req, res) => {
  try {
    //find the user by the userId passed from the verifyToken middleware
    const user = await User.findById(req.userId);

    //if user is not found, return an error
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    //send a response with the user details
    res.status(200).json({
      success: true,
      user: {
        ...user._doc,
        password: undefined, //do not send the password in the response
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
