import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

/**
 * User signup/registration handler
 * 
 * Creates a new user account with hashed password and generates JWT token.
 * 
 * @async
 * @function signup
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.fullName - User's full name
 * @param {string} req.body.email - User's email address (must be unique)
 * @param {string} req.body.password - User's password (min 6 characters)
 * @param {Object} res - Express response object
 * 
 * @returns {Promise<void>} JSON response with user data or error message
 * 
 * @throws {400} All fields are required
 * @throws {400} Password must be at least 6 characters
 * @throws {400} Email already exists
 * @throws {400} Invalid user data
 * @throws {500} Internal Server Error
 * 
 * @example
 * // Request body
 * {
 *   "fullName": "John Doe",
 *   "email": "john@example.com",
 *   "password": "securepass123"
 * }
 * 
 * // Success response (201)
 * {
 *   "_id": "507f1f77bcf86cd799439011",
 *   "fullName": "John Doe",
 *   "email": "john@example.com",
 *   "profilePic": ""
 * }
 * 
 * @security
 * - Password is hashed using bcrypt with salt rounds of 10
 * - JWT token set as httpOnly cookie
 * - Email uniqueness enforced at database level
 * 
 * @todo Add email validation
 * @todo Add rate limiting
 * @todo Implement email verification
 */
export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email });

    if (user) return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      // generate jwt token here
      generateToken(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * User login handler
 * 
 * Authenticates user with email and password, generates JWT token on success.
 * 
 * @async
 * @function login
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.email - User's email address
 * @param {string} req.body.password - User's password
 * @param {Object} res - Express response object
 * 
 * @returns {Promise<void>} JSON response with user data or error message
 * 
 * @throws {400} Invalid credentials (user not found or wrong password)
 * @throws {500} Internal Server Error
 * 
 * @example
 * // Request body
 * {
 *   "email": "john@example.com",
 *   "password": "securepass123"
 * }
 * 
 * // Success response (200)
 * {
 *   "_id": "507f1f77bcf86cd799439011",
 *   "fullName": "John Doe",
 *   "email": "john@example.com",
 *   "profilePic": "https://..."
 * }
 * 
 * @security
 * - Password compared using bcrypt
 * - Generic error message to prevent user enumeration
 * - JWT token set as httpOnly cookie
 * 
 * @todo Add rate limiting to prevent brute force
 * @todo Add account lockout after failed attempts
 * @todo Add login attempt logging
 */
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * User logout handler
 * 
 * Clears the JWT token cookie to log out the user.
 * 
 * @function logout
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * 
 * @returns {void} JSON response with success message
 * 
 * @throws {500} Internal Server Error
 * 
 * @example
 * // Success response (200)
 * {
 *   "message": "Logged out successfully"
 * }
 * 
 * @security
 * - Clears JWT cookie by setting maxAge to 0
 * - No server-side session invalidation (stateless JWT)
 * 
 * @todo Consider implementing token blacklist for enhanced security
 */
export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Update user profile picture
 * 
 * Uploads a new profile picture to Cloudinary and updates user record.
 * 
 * @async
 * @function updateProfile
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.profilePic - Base64 encoded image data
 * @param {Object} req.user - Authenticated user object (from protectRoute middleware)
 * @param {string} req.user._id - User's MongoDB ObjectId
 * @param {Object} res - Express response object
 * 
 * @returns {Promise<void>} JSON response with updated user data
 * 
 * @throws {400} Profile pic is required
 * @throws {500} Internal server error (Cloudinary upload or database error)
 * 
 * @example
 * // Request body
 * {
 *   "profilePic": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
 * }
 * 
 * // Success response (200)
 * {
 *   "_id": "507f1f77bcf86cd799439011",
 *   "fullName": "John Doe",
 *   "email": "john@example.com",
 *   "profilePic": "https://res.cloudinary.com/..."
 * }
 * 
 * @security
 * - Requires authentication (protectRoute middleware)
 * - No file size validation (potential DoS risk)
 * - No file type validation
 * 
 * @todo Add image size validation (max 5MB)
 * @todo Add image format validation (JPEG, PNG, GIF only)
 * @todo Add error handling for Cloudinary failures
 */
export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Check authentication status
 * 
 * Returns the currently authenticated user's data.
 * Used by frontend to verify authentication and get user info.
 * 
 * @function checkAuth
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user object (from protectRoute middleware)
 * @param {Object} res - Express response object
 * 
 * @returns {void} JSON response with user data
 * 
 * @throws {500} Internal Server Error
 * 
 * @example
 * // Success response (200)
 * {
 *   "_id": "507f1f77bcf86cd799439011",
 *   "fullName": "John Doe",
 *   "email": "john@example.com",
 *   "profilePic": "https://..."
 * }
 * 
 * @security
 * - Requires valid JWT token (protectRoute middleware)
 * - Password field excluded from response
 */
export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

