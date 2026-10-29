import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { validateInput } from "../utils/guardrail.js";
import { errorResponse, successResponse, } from "../utils/response.js";
import { askAI } from "../services/ai.service.js";
import { generateSummary } from "../services/summary.service.js";
import { countMessageTokens } from "../utils/token.js";
import { moderateInput } from "../services/moderation.service.js";
import { retrieveRelevantContext } from "../services/rag.service.js";
// import { buildContext } from "../utils/context.js";


const SUMMARY_THRESHOLD = 200;
const RECENT_MESSAGES_TO_KEEP = 4;

export const chatController = async (req, res, next) => {

  try {

    const { conversationId, message ,category } = req.body;
    const validation = validateInput(message);

    if (!validation.allowed) {
      return errorResponse(
        res,
        validation.reason,
        400
      );
    }

    const moderation = await moderateInput(message);

    if (moderation.flagged) {
      return errorResponse(
        res,
        "Your message cannot be processed because it violates our safety policy.",
        400,
        {
          categories: moderation.categories,
        }
        
      );
    }
  
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

    }
     else {

      conversation = await Conversation.create({
      title: message.substring(0, 30),
      category: category || "portfolio_data",
  });
    }

    await Message.create({
      conversationId: conversation._id,
      role: "user",
      content: message,
    });

    const allMessages = await Message.find({ conversationId: conversation._id, })
      .sort({ createdAt: 1, _id: 1 })     // older to newest messages
      .select("role content -_id");
      
    const summaryMessageCount = conversation.summaryMessageCount || 0;
    const unsummarizedMessages = allMessages.slice(summaryMessageCount);   

    // ==========================================
    //  Count tokens of unsummarized messages
    // ==========================================

    const unsummarizedTokens = countMessageTokens(unsummarizedMessages);
  
    if (unsummarizedTokens >= SUMMARY_THRESHOLD) {

      const messagesToSummarize = unsummarizedMessages.slice(0, -RECENT_MESSAGES_TO_KEEP);  

      if (messagesToSummarize.length > 0) {

        const newSummary = await generateSummary(messagesToSummarize, conversation.summary);
        conversation.summary = newSummary;
        conversation.summaryMessageCount = summaryMessageCount + messagesToSummarize.length;
        await conversation.save();

      }
    }

    // ==========================================
    // 7. Get messages again after summary update
    // ==========================================

    const recentMessages = allMessages.slice(conversation.summaryMessageCount);


    // 8. Build token-based context
    // const context =buildContext(recentMessages);
    
    const ragContext = await retrieveRelevantContext(message , category);
    

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders(); 

    res.write(`data: ${JSON.stringify({ event: "init", conversationId: conversation._id })}\n\n`);
    let fullAiResponse = "";

    try {
      const stream = askAI(recentMessages, conversation.summary ,ragContext , category);

      
      for await (const chunk of stream) {
        fullAiResponse += chunk;
      
        res.write(`data: ${JSON.stringify({ event: "chunk", content: chunk })}\n\n`);
      }

  
      if (fullAiResponse.trim()) {
        await Message.create({
          conversationId: conversation._id,
          role: "assistant",
          content: fullAiResponse,
        });
      }

    
      res.write(`data: ${JSON.stringify({ event: "done" })}\n\n`);
      res.end();

    } catch (streamError) {
      console.error("Streaming error:", streamError);
      res.write(`data: ${JSON.stringify({ event: "error", message: "Failed to generate AI response." })}\n\n`);
      res.end();
    }

  } catch (error) {
    
    next(error);
  }
};