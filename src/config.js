const CONFIG = {

  ollamaBaseUrl: "http://localhost:11434",

  model: "llama3.2",

  siteName: "MyBrand",
  botName: "Site Assistant",
  maxHistoryMessages: 10,
  maxTokens: 300,

  quickReplies: [
    { label: "What can I do here?",  text: "What can I do on this site?" },
    { label: "Get started",          text: "How do I get started?" },
    { label: "Contact support",      text: "How do I contact support?" },
  ],

systemPrompt: `You are a chat assistant embedded in a demo page. This is just a test site with no real content, services, or resources.

Your rules:
- If asked anything about the site, say: This is just a demo page, there's nothing here yet.
- Do not suggest resources, links, or services you don't actually know about
- Never make anything up
- Keep replies short — 2 sentences max`,
};