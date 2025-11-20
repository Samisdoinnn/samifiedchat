import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import mongoose from "mongoose";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Send a message with comprehensive validation and security
 * 
 * @async
 * @route POST /api/messages/send/:id
 * @access Protected
 * 
 * @security
 * - Validates receiverId to prevent NoSQL injection
 * - Enforces 5MB image size limit to prevent DoS
 * - Validates image format
 * - Implements upload timeout
 * 
 * @performance
 * - Parallel save and socket emit
 * - Timeout prevents hanging requests
 */
export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // SECURITY: Validate receiverId format (prevent NoSQL injection)
    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({
        error: "Invalid recipient ID",
        code: "INVALID_RECEIVER"
      });
    }

    // LOGIC: Validate message content
    if (!text && !image) {
      return res.status(400).json({
        error: "Message must contain text or image",
        code: "EMPTY_MESSAGE"
      });
    }

    // LOGIC: Validate text length
    if (text && text.trim().length === 0) {
      return res.status(400).json({
        error: "Message text cannot be empty",
        code: "EMPTY_TEXT"
      });
    }

    if (text && text.length > 10000) {
      return res.status(400).json({
        error: "Message text too long (max 10,000 characters)",
        code: "TEXT_TOO_LONG"
      });
    }

    let imageUrl;
    if (image) {
      // SECURITY: Validate image size (prevent DoS)
      const sizeInBytes = (image.length * 3) / 4; // Base64 to bytes
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB

      if (sizeInBytes > MAX_SIZE) {
        return res.status(400).json({
          error: "Image too large (max 5MB)",
          code: "IMAGE_TOO_LARGE"
        });
      }

      // SECURITY: Validate image format
      if (!image.startsWith('data:image/')) {
        return res.status(400).json({
          error: "Invalid image format",
          code: "INVALID_IMAGE_FORMAT"
        });
      }

      // RELIABILITY: Upload with timeout and error handling
      try {
        const uploadResponse = await Promise.race([
          cloudinary.uploader.upload(image, {
            resource_type: 'image',
            max_bytes: MAX_SIZE,
            timeout: 60000 // 60 second timeout
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Upload timeout')), 60000)
          )
        ]);

        imageUrl = uploadResponse.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', {
          error: uploadError.message,
          senderId,
          receiverId,
          timestamp: new Date().toISOString()
        });

        return res.status(500).json({
          error: "Failed to upload image. Please try again",
          code: "UPLOAD_FAILED"
        });
      }
    }

    // Create message
    const newMessage = new Message({
      senderId,
      receiverId,
      text: text ? text.trim() : undefined, // Trim whitespace
      image: imageUrl,
    });

    // PERFORMANCE: Save and emit in parallel (don't wait for save to emit)
    const [savedMessage] = await Promise.all([
      newMessage.save(),
      // Emit to socket immediately (don't wait for DB)
      (async () => {
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("newMessage", {
            ...newMessage.toObject(),
            _id: newMessage._id
          });
        }
      })()
    ]);

    res.status(201).json(savedMessage);
  } catch (error) {
    console.error("Error in sendMessage controller:", {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      error: "Failed to send message",
      code: "SEND_ERROR"
    });
  }
};

