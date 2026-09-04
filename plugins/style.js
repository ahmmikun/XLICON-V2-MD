module.exports = {
    name: 'style',
    description: 'txt styler font changer',
    aliases: ['font', 'textstyle', 'styler'],
    tags: ['main'],
   
    command: /^(?:\.|\/|!)?\s*style/i,

    async execute(sock, m) {
        try {
            // Extract the query (text to style) from the message body
            const messageText = m.body || m.text || '';
            const q = messageText.replace(/^(?:\.|\/|!)?\s*style\s*/i, '').trim();

            // Check if user input is provided
            if (!q) {
                return await sock.sendMessage(m.from, { 
                    text: "*Example:* `.style 1,zaid bhi`\n\n" +
                          "1. ᴢᴀɪᴅ ʙʜɪ \n" +
                          "2. ⓩⓐⓘⓓ ⓑⓗⓘ \n" +
                          "3. zɒᴉb dɥᴉ \n" +
                          "4. 𝔃𝓪𝓲𝓭 𝓫𝓱𝓲 \n" +
                          "5. 𝕫𝕒𝕚𝕕 𝕓𝕙𝕚 \n" +
                          "6. 🅉🄰🄸🄳 🄱🄷🄸 \n" +
                          "7. ᶻᵃᶦᵈ ᵇʰᶦ \n" +
                          "8. ʐᴀɨð ʙʰɨ \n" +
                          "9. 🅩🅐🅘🅓 🅑🅗🅘\n" +
                          "10. 🆉🅰🅸🅳 🅱🅷🅸"
                });
            }

            // Fetch styled text from API (with URL encoding for safety)
            const apiUrl = `https://zaid-bhi-text-styler.vercel.app/api/textStyler?txt=${encodeURIComponent(q)}`;
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`API responded with status: ${response.status}`);
            }
            
            const data = await response.json();

            // Check if styledText is available in API response
            if (data && data.styledText) {
                await sock.sendMessage(m.from, { text: data.styledText });
            } else {
                throw new Error("Could not retrieve styled text from API.");
            }

        } catch (err) {
            console.error('❌ Style plugin error:', err);
            await sock.sendMessage(m.from, { 
                text: `Error: ${err.message || 'Failed to style text. Please try again.'}` 
            });
        }
    },
};
