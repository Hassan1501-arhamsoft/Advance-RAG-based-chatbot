import express from "express";

import {
  getConversations,
  getConversation,
} from "../controllers/conversation.controller.js";

const router = express.Router();


// Get all conversations
router.get("/", getConversations);


// Get single conversation
router.get(
  "/:conversationId",
  getConversation
);


export default router;