import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { validateInput } from "../utils/guardrail.js";
import { errorResponse, successResponse, } from "../utils/response.js";
import { askAI } from "../services/ai.service.js";
import { generateSummary } from "../services/summary.service.js";
import { countMessageTokens } from "../utils/token.js";
import { moderateInput } from "../services/moderation.service.js";
// import { buildContext } from "../utils/context.js";


const SUMMARY_THRESHOLD = 200;
const RECENT_MESSAGES_TO_KEEP = 4;

export const chatController = async (req, res, next) => {

  try {

    const { conversationId, message } = req.body;
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

      conversation = await Conversation.create({ title: message.substring(0, 30), });
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

    // ==========================================
    // 8. Build token-based context
    // ==========================================

    // const context =buildContext(recentMessages);
    // console.log(context)

    const aiResult = await askAI(recentMessages, conversation.summary);


    await Message.create({
      conversationId: conversation._id,
      role: "assistant",
      content: aiResult.content,
    });



    return successResponse(
      res,
      "AI response generated successfully",
      {
        conversationId: conversation._id,

        response: aiResult.content,

        usage: aiResult.usage,

        // contextTokens: context.totalContextTokens,

        summary: conversation.summary,
      },
      200
    );

  } catch (error) {

    next(error);

  }
};