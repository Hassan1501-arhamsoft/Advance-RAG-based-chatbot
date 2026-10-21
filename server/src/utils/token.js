import { encodingForModel } from "js-tiktoken";

const encoder = encodingForModel("gpt-4o");


//~ ===========================================================================
//^ converts text into tokens and assigns a standard ID (integer) to each token
//~ =========================================================================== 

export const countTokens = (text) => {
  return encoder.encode(text).length;
};


// Count tokens in messages
export const countMessageTokens = (messages) => {
  return messages.reduce((total, message) => {
    return total + countTokens(message.content);
  }, 0);
};