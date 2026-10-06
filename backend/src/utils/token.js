import { encodingForModel } from "js-tiktoken";

const encoder = encodingForModel("gpt-4o");


// Count tokens in text
export const countTokens = (text) => {
  return encoder.encode(text).length;
};


// Count tokens in messages
export const countMessageTokens = (messages) => {
  return messages.reduce((total, message) => {
    return total + countTokens(message.content);
  }, 0);
};