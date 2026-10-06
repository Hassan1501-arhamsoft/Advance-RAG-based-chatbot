import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";

import {
  errorResponse,
  successResponse,
} from "../utils/response.js";

import { askAI } from "../services/ai.services.js";

import { buildContext } from "../utils/context.js";


export const chatController = async (req, res, next) => {
  try {
    const { conversationId, message } = req.body;


    // ==========================================
    // 1. Find or create conversation
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
    // 3. Get all conversation messages
    // ==========================================

    const allMessages = await Message.find({
      conversationId: conversation._id,
    })
      .sort({ createdAt: 1 })
      .select("role content -_id");


    // ==========================================
    // 4. Build token-based context
    // ==========================================

    const context = buildContext(
      allMessages
    );


    // ==========================================
    // 5. Send selected context to AI
    // ==========================================

    const aiResult = await askAI(
      context.messages
    );


    // ==========================================
    // 6. Get AI response
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

        contextTokens: context.tokenCount,

        usage,
      },
      200
    );

  } catch (error) {

    next(error);

  }
};