import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";

import {
  successResponse,
  errorResponse,
} from "../utils/response.js";


// Get all conversations
export const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find()
      .sort({ updatedAt: -1 })
      .select("title createdAt updatedAt");

    return successResponse(
      res,
      "Conversations retrieved successfully",
      conversations,
      200
    );
  } catch (error) {
    next(error);
  }
};


// Get one conversation with messages
export const getConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(
      conversationId
    );

    if (!conversation) {
      return errorResponse(
        res,
        "Conversation not found",
        404
      );
    }

    const messages = await Message.find({
      conversationId: conversation._id,
    })
      .sort({ createdAt: 1 })
      .select("role content createdAt -_id");

    return successResponse(
      res,
      "Conversation retrieved successfully",
      {
        conversation,
        messages,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};