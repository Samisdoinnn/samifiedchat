import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

/**
 * Authentication middleware with proper error handling and performance optimization
 * 
 * Validates JWT token and attaches user to request object.
 * 
 * @middleware
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 * 
 * @returns {void} Calls next() on success, sends error response on failure
 * 
 * @throws {401} NO_TOKEN - No authentication token provided
 * @throws {401} TOKEN_EXPIRED - JWT token has expired
 * @throws {401} INVALID_TOKEN - JWT token is malformed or invalid
 * @throws {401} USER_NOT_FOUND - User account no longer exists
 * @throws {500} AUTH_ERROR - Unexpected authentication error
 * 
 * @performance Uses .lean() to return plain objects (50% faster than Mongoose documents)
 * @security Distinguishes between expired and invalid tokens
 * @maintainability Structured error codes aid frontend error handling
 */
export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(401).json({
        message: "Authentication required",
        code: "NO_TOKEN"
      });
    }

    // Verify token - jwt.verify() throws on invalid/expired tokens
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      // Distinguish between expired and invalid tokens for better UX
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          message: "Session expired. Please login again",
          code: "TOKEN_EXPIRED"
        });
      }

      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          message: "Invalid authentication token",
          code: "INVALID_TOKEN"
        });
      }

      // Unexpected JWT error
      throw jwtError;
    }

    // PERFORMANCE: Use lean() to return plain JS object (faster than Mongoose document)
    const user = await User.findById(decoded.userId)
      .select("-password")
      .lean();

    if (!user) {
      // User was deleted after token was issued
      return res.status(401).json({
        message: "User account no longer exists",
        code: "USER_NOT_FOUND"
      });
    }

    // Attach user to request for downstream middleware/controllers
    req.user = user;
    req.userId = decoded.userId; // Also provide ID separately for convenience

    next();
  } catch (error) {
    // Log authentication failures for security monitoring
    console.error('Authentication middleware error:', {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      message: "Authentication service error",
      code: "AUTH_ERROR"
    });
  }
};

