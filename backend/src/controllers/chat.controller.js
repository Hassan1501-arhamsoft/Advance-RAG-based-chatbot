import { askAI } from "../services/ai.services.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const chatController = async (req, res) => {
  try {
    const { message } = req.body;

    const response = await askAI(message);

    return successResponse(
      res,
      "AI response generated successfully",
      { response },
      200
    );
  } catch (error) {
    console.error("AI Chat Error:", error);

    return errorResponse(
      res,
      "AI request failed",
      500,
      error.message
    );
  }
};