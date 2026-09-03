module.exports = {
    name: 'agecalculator',
    description: 'Calculate age with detailed breakdown',
    aliases: ['age', 'calcage'],
    tags: ['main'],
    
    command: /^(?:\.|\/|!)?\s*agecalculator/i,

    async execute(sock, m) {
        try {
            // Extract the query (date) from the message body
            
            const messageText = m.body || m.text || '';
            const q = messageText.replace(/^(?:\.|\/|!)?\s*agecalculator\s*/i, '').trim();

            // Check if 'q' has a valid date input
            if (!q) {
                return await sock.sendMessage(m.from, { 
                    text: "*Example:* .agecalculator mm/dd/yyyy" 
                });
            }

            // Fetch age data from the API
            const apiUrl = `https://zaid-bhi-calculate-age.vercel.app/api/calculate?age=${encodeURIComponent(q)}`;
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`API responded with status: ${response.status}`);
            }
            
            const data = await response.json();

            // Format the response message with detailed age information
            const responseText = `*Your Age Details:*\n\n` +
                `🎂 *Age:* ${data.age}\n` +
                `📅 *Age in Months:* ${data["age-in-Months"]}\n` +
                `📆 *Age in Days:* ${data["age-in-Days"]}\n` +
                `📌 *Age in Weeks:* ${data["age-in-Weeks"]}\n` +
                `⏰ *Age in Hours:* ${data["age-in-Hours"]}\n` +
                `⏱️ *Age in Minutes:* ${data["age-in-Minutes"]}\n` +
                `⏳ *Age in Seconds:* ${data["age-in-Seconds"]}`;

            // Send the formatted age information to the user
            await sock.sendMessage(m.from, { text: responseText });

        } catch (err) {
            console.error('❌ Agecalculator plugin error:', err);
            await sock.sendMessage(m.from, { 
                text: `Error: ${err.message || 'Failed to calculate age. Please check the date format (e.g., mm/dd/yyyy).'}` 
            });
        }
    },
};
