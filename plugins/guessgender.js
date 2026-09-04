module.exports = {
    name: 'guessgender',
    description: 'Check gender of a person by name.',
    aliases: ['gender'],
    tags: ['main', 'fun'],
    
    command: /^(?:\.|\/|!)?\s*guessgender/i,

    async execute(sock, m) {
        try {
            // Extract the query (name) from the message body
            const messageText = m.body || m.text || '';
            
            
            const q = messageText.replace(/^(?:\.|\/|!)?\s*guessgender\s*/i, '').trim();

            // Check if a name is provided
            if (!q) {
                return await sock.sendMessage(m.from, { 
                    text: "*Example:* `.guessgender imran`" 
                }); 
            }

            // Make API call to genderize.io
            const apiUrl = `https://api.genderize.io/?name=${encodeURIComponent(q)}`;
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`API responded with status: ${response.status}`);
            }
            
            const result = await response.json();

            // Check if the API response has a valid gender prediction
            if (result && result.gender) {
                const probability = result.probability || 0; // Fallback to 0 just in case
                const probabilityPercent = (probability * 100).toFixed(1);
                
                const responseText = `*Name:* ${result.name}\n` +
                                     `*Gender:* ${result.gender.charAt(0).toUpperCase() + result.gender.slice(1)}\n` +
                                     `*Probability:* ${probabilityPercent}%\n` +
                                     `*Count:* ${result.count}`;
                                     
                await sock.sendMessage(m.from, { 
                    text: responseText 
                }); 
            } else {
                await sock.sendMessage(m.from, { 
                    text: "Unable to determine gender. Please try again with another name." 
                }); 
            }
        } catch (err) {
            console.error('❌ GuessGender plugin error:', err);
            await sock.sendMessage(m.from, { 
                text: `*Error*: ${err.message || 'Failed to fetch data.'}` 
            }); 
        }
    },
};
