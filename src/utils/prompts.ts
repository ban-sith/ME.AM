const PROMPTS = [
  "What's your #1 goal for tomorrow?",
  "Why should you wake up early?",
  "What are you grateful for today?",
  "Tell future-you why tomorrow matters.",
  "What would make tomorrow amazing?",
  "Record a pep talk for your morning self.",
  "What habit are you building?",
  "Remind yourself why you started.",
  "What's one thing you're excited about?",
  "Future you needs to hear this...",
  "What would you tell your best friend?",
  "Why is this week important?",
  "What's your morning motivation?",
  "Say something that'll make you smile.",
  "Record your battle cry!",
  "What are you working towards?",
  "Leave a voice note of encouragement.",
  "What's your superpower tomorrow?",
  "Tell yourself: you got this.",
  "What would make you proud tomorrow?",
  "Record your daily affirmation.",
  "What challenge will you crush tomorrow?",
  "Describe your ideal morning.",
  "What energy do you want to wake up with?",
  "Give yourself a 10-second pep talk.",
];

export function getDailyPrompt(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return PROMPTS[dayOfYear % PROMPTS.length];
}

export function getRandomPrompt(): string {
  return PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
}
