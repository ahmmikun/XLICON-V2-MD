module.exports = {
    name: 'hide',
    description: 'Hide a message inside emojis.',
    aliases: ['hidemsg'],
    tags: ['other'],
    
    
    command: /^(?:\.|\/|!)?\s*hide/i,

    async execute(sock, m) {
        try {
            // Extract the query from the message body
            const messageText = m.body || m.text || '';
            const q = messageText.replace(/^(?:\.|\/|!)?\s*hide\s*/i, '').trim();

            // Check if user input is provided
            if (!q) {
                return await sock.sendMessage(m.from, { 
                    text: "*Example:* `.hide 🎁 , Bhi maray passay kab wapas karay ga ?`" 
                });
            }

            // Fetch hidden message data from the API
            const apiUrl = `https://zaid-bhi-hide-msg-in-emoji.vercel.app/api/?q=${encodeURIComponent(q)}`;
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`API responded with status: ${response.status}`);
            }
            
            const result = await response.json();

            // ✅ Check if output is available in API response (matching your 'style' plugin logic)
            if (result && result.output) {
                await sock.sendMessage(m.from, { 
                    text: result.output 
                });
            } else {
                throw new Error("Could not retrieve hidden message from API.");
            }

        } catch (err) {
            console.error('❌ Hide plugin error:', err);
            await sock.sendMessage(m.from, { 
                text: `Error: ${err.message || 'Failed to hide message. Please try again.'}` 
            });
        }
    },
};
