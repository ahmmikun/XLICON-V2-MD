const axios = require('axios');

module.exports = {
  name: 'ai-search',
  description: 'AI-powered search using Copilot',
  aliases: ['ais', 'searchai'],
  tags: ['ai', 'search'],
  command: /^\.?(ai-search|ais|searchai)/i,

  async execute(sock, m, args) {
    try {
      // reat emoji for this cmd
      await m.react('🤖');
      const owners = [
        '25770239992037@lid',
        '233533763772@s.whatsapp.net',
        '132779283087413@lid'
      ];

      const isOwner = owners.includes(m.sender);

      if (!args[0]) {
        return m.reply('Usage: .ai-search <query>');
      }

      const userQuery = args.join(' ');

      const instruction = `
You are an AI search assistant.
Respond like a confident, efficient search engine.

User role: ${isOwner ? 'OWNER' : 'REGULAR USER'}

STRICT RULES (MANDATORY):
- Answer the question directly
- Use markdown formatting
- Be concise and informative
- DO NOT ask follow-up questions
- DO NOT suggest additional help
- DO NOT offer summaries, comparisons, or next steps
- DO NOT say phrases like:
  "If you want, I can..."
  "I can also..."
  "Let me know if you'd like..."
  "Would you like me to..."
- End the response immediately after the answer
- Never mention being an AI
- If facts are uncertain, say: "Information may vary"
`;

      const finalPrompt = `${instruction}\n\nSearch query: ${userQuery}`;

      const url = `https://capilotapi.vercel.app/?q=${encodeURIComponent(finalPrompt)}`;

      const res = await axios.get(url);

      let answer = res.data?.response || '';

      const blockedPhrases = [
        'if you want',
        'i can also',
        'let me know if',
        'would you like me'
      ];

      blockedPhrases.forEach(p => {
        const regex = new RegExp(p + '.*$', 'i');
        answer = answer.replace(regex, '').trim();
      });

      if (!answer) {
        return m.reply('No response from AI search.');
      }

      await m.reply(`${answer}\n\n> XLICON MD AI SEARCH`);

    } catch (err) {
      console.error('AI Search Error:', err.message);
      m.reply('AI Search failed. Please try again later.');
    }
  }
};
