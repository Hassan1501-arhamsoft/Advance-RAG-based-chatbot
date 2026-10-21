const BLOCKED_PHRASES = [
  // Violence / physical harm
  "how to kill someone",
  "how to murder someone",
  "how to seriously hurt someone",
  "how to attack someone",
  "how to poison someone",

  // Weapons / explosives
  "how to make a bomb",
  "how to make an explosive",
  "how to build a weapon",
  "how to make a weapon",
  "how to make a firearm",
  "how to modify a weapon",

  // Illegal drugs
  "how to manufacture illegal drugs",
  "how to make illegal drugs",
  "how to sell illegal drugs",
  "how to traffic drugs",

  // Cyber abuse
  "how to hack someone's account",
  "how to steal someone's password",
  "how to bypass someone's password",
  "how to steal login credentials",
  "how to install malware",
  "how to deploy ransomware",

  // Financial fraud
  "how to commit credit card fraud",
  "how to steal credit card information",
  "how to commit bank fraud",
  "how to steal someone's money",

  // Privacy / personal data abuse
  "how to steal someone's identity",
  "how to access someone's private account",
  "how to track someone without permission",
];

export const validateInput = (message) => {
  
  if (!message) {
    return {
      allowed: false,
      reason: "Message is required",
    };
  }


  if (typeof message !== "string") {
    return {
      allowed: false,
      reason: "Message must be a string",
    };
  }

 
  const cleanMessage = message.trim();

  
  if (!cleanMessage) {
    return {
      allowed: false,
      reason: "Message cannot be empty",
    };
  }


  if (cleanMessage.length > 2000) {
    return {
      allowed: false,
      reason: "Message is too long",
    };
  }


  const lowerMessage = cleanMessage.toLowerCase();

  const containsBlockedWord = BLOCKED_PHRASES.some(
    (word) => lowerMessage.includes(word)
  );

  if (containsBlockedWord) {
    return {
      allowed: false,
      reason: "This message is not allowed",
    };
  }


  return {
    allowed: true,
    message: cleanMessage,
  };
};