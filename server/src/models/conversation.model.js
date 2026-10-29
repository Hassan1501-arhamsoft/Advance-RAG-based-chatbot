import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["portfolio_data", "stranger_things"],
      default: "portfolio_data",
    },
    summary: {
      type: String,
      default: "",
    },
    summaryMessageCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Conversation", conversationSchema);