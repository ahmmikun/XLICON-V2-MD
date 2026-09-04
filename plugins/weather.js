
module.exports = {
    name: 'weather',
    description: '🌤 Get weather information for a location',
    aliases: ['weatherinfo', 'temp'],
    tags: ['other'],
    // Matches .weather, /weather, !weather, or just weather
    command: /^(?:\.|\/|!)?\s*weather/i,

    async execute(sock, m) {
        try {
            // Extract the query (city name) from the message body
            const messageText = m.body || m.text || '';
            const q = messageText.replace(/^(?:\.|\/|!)?\s*weather\s*/i, '').trim();

            // Check if 'q' has a valid city input
            if (!q) {
                return await sock.sendMessage(m.from, { 
                    text: "Please provide a city name. Usage: `.weather [city name]`" 
                });
            }

            // Fetch weather data from the OpenWeatherMap API
            const apiKey = '2d61a72574c11c4f36173b627f8cb177'; 
            const apiUrl = `http://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(q)}&appid=${apiKey}&units=metric`;
            
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('🚫 City not found. Please check the spelling and try again.');
                }
                throw new Error(`API responded with status: ${response.status}`);
            }
            
            const data = await response.json();

            // Format the response message with detailed weather information
            const responseText = `*Weather Information for ${data.name}, ${data.sys.country}* 🌤\n\n` +
                `🌡️ *Temperature*: ${data.main.temp}°C\n` +
                `🤔 *Feels Like*: ${data.main.feels_like}°C\n` +
                `❄️ *Min Temp*: ${data.main.temp_min}°C\n` +
                `🔥 *Max Temp*: ${data.main.temp_max}°C\n` +
                `💧 *Humidity*: ${data.main.humidity}%\n` +
                `⛅ *Weather*: ${data.weather[0].main}\n` +
                `📝 *Description*: ${data.weather[0].description}\n` +
                `💨 *Wind Speed*: ${data.wind.speed} m/s\n` +
                `🌪️ *Pressure*: ${data.main.pressure} hPa\n\n` +
                `© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴢᴀɪᴅ ʜᴜssᴀɪɴ`;

            // Send the formatted weather information to the user
            await sock.sendMessage(m.from, { text: responseText });

        } catch (err) {
            console.error('❌ Weather plugin error:', err);
            await sock.sendMessage(m.from, { 
                text: `Error: ${err.message || '⚠️ API Key Server Down or failed to fetch weather data.'}` 
            });
        }
    },
};
