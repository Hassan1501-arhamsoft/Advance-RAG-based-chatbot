import mongoose from "mongoose";

const knowledgeSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number], 
      required: true,
    },
    
    metadata: { 
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

const Knowledge = mongoose.model("Knowledge", knowledgeSchema);
export default Knowledge;