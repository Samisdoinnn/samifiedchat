import jwt from "jsonwebtoken";

/**
 * Generate JWT token and set it as an HTTP-only cookie
 * 
 * Creates a signed JWT token containing the user ID and sets it as a secure cookie
 * in the response. The token is valid for 7 days.
 * 
 * @function generateToken
 * @param {string|ObjectId} userId - MongoDB ObjectId of the user
 * @param {Object} res - Express response object
 * 
 * @returns {string} The generated JWT token
 * 
 * @example
 * const token = generateToken(user._id, res);
 * // Token is automatically set as cookie in response
 * 
 * @security
 * Cookie Security Features:
 * - httpOnly: true - Prevents XSS attacks by making cookie inaccessible to JavaScript
 * - sameSite: "strict" - Prevents CSRF attacks by only sending cookie on same-site requests
 * - secure: true (production) - Only sends cookie over HTTPS in production
 * - maxAge: 7 days - Cookie expires after 7 days
 * 
 * JWT Configuration:
 * - Algorithm: HS256 (default)
 * - Expiration: 7 days
 * - Secret: process.env.JWT_SECRET (must be at least 32 characters)
 * 
 * @throws {Error} If JWT_SECRET environment variable is not set
 * 
 * @todo Implement token refresh mechanism
 * @todo Add token blacklist for logout
 * @todo Reduce token expiration time and add refresh tokens
 */
export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // MS
    httpOnly: true, // prevent XSS attacks cross-site scripting attacks
    sameSite: "strict", // CSRF attacks cross-site request forgery attacks
    secure: process.env.NODE_ENV !== "development",
  });

  return token;
};

