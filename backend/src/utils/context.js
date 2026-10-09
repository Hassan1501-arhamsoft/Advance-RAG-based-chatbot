import { countTokens } from "./token.js";

const MAX_CONTEXT_TOKENS = 4000;  
const SYSTEM_PROMPT_TOKENS = 200;
const RESERVED_OUTPUT_TOKENS = 800;

//~ ==========================================
//^ Build token-based conversation context
//~ ==========================================

export const buildContext = ( messages ) => {

    const availableHistoryTokens =
        MAX_CONTEXT_TOKENS -
        SYSTEM_PROMPT_TOKENS -
        RESERVED_OUTPUT_TOKENS;

    const selectedMessages = [];

    let totalTokens = 0;

    for (let i = messages.length - 1; i >= 0; i--) {

        const message = messages[i];

        const messageTokens = countTokens(
            message.content
        );

        if (
            totalTokens + messageTokens >
            availableHistoryTokens
        ) {
            break;
        }

        selectedMessages.unshift(message);

        totalTokens += messageTokens;
    }

    
    

    return {
        messages: selectedMessages,

        historyTokens: totalTokens,

        availableHistoryTokens,

        totalContextTokens:
            totalTokens +
            SYSTEM_PROMPT_TOKENS +
            RESERVED_OUTPUT_TOKENS,
    };
};