import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import {errorResponse, successResponse} from "../utils/response.js";
import { askAI } from "../services/ai.services.js";

export const chatController = async (req, res, next) => {
  try {
    const { conversationId, message } = req.body;

    // 1. Find existing conversation or create a new one
    let conversation;

    if (conversationId) {
      conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        return errorResponse(
          res,
          "Conversation not found",
          404
        );
      }
    } else {
      conversation = await Conversation.create({
        title: message.substring(0, 30),
      });
    }

    // 2. Save user's message
    await Message.create({
      conversationId: conversation._id,
      role: "user",
      content: message,
    });

    // 3. Get previous conversation messages
    const previousMessages = await Message.find({
      conversationId: conversation._id,
    })
      .sort({ createdAt: 1 })
      .select("role content -_id");

    // 4. Send conversation history to AI
    const aiResponse = await askAI(previousMessages);

    // 5. Save AI response
    await Message.create({
      conversationId: conversation._id,
      role: "assistant",
      content: aiResponse,
    });

    // 6. Return response
    return successResponse(
      res,
      "AI response generated successfully",
      {
        conversationId: conversation._id,
        response: aiResponse,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};