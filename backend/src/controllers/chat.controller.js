import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";

import {
  errorResponse,
  successResponse,
} from "../utils/response.js";

import { askAI } from "../services/ai.services.js";


// Maximum number of previous messages
// we send to the AI
const MAX_HISTORY_MESSAGES = 20;


export const chatController = async (req, res, next) => {
  try {
    const { conversationId, message } = req.body;


    // ==========================================
    // 1. Find existing conversation or create
    // ==========================================

    let conversation;

    if (conversationId) {
      conversation = await Conversation.findById(
        conversationId
      );

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


    // ==========================================
    // 2. Save user's message
    // ==========================================

    await Message.create({
      conversationId: conversation._id,
      role: "user",
      content: message,
    });


    // ==========================================
    // 3. Get recent conversation history
    // ==========================================

    const previousMessages = await Message.find({
      conversationId: conversation._id,
    })
      .sort({ createdAt: -1 })
      .limit(MAX_HISTORY_MESSAGES)
      .select("role content -_id");


    // ==========================================
    // 4. Reverse messages back to oldest → newest
    // ==========================================

    previousMessages.reverse();


    // ==========================================
    // 5. Send recent history to AI
    // ==========================================

    const aiResult = await askAI(
      previousMessages
    );


    // ==========================================
    // 6. Get AI response and token usage
    // ==========================================

    const aiResponse = aiResult.content;

    const usage = aiResult.usage;


    // ==========================================
    // 7. Save AI response
    // ==========================================

    await Message.create({
      conversationId: conversation._id,
      role: "assistant",
      content: aiResponse,
    });


    // ==========================================
    // 8. Return response
    // ==========================================

    return successResponse(
      res,
      "AI response generated successfully",
      {
        conversationId: conversation._id,
        response: aiResponse,
        usage,
      },
      200
    );

  } catch (error) {
    next(error);
  }
};