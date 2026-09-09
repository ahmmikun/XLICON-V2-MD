const axios = require('axios');

module.exports = {
    name: 'instadl',
    aliases: ['insta', 'instagram', 'ig'],
    
    async execute(sock, m, args) {
        // reat emoji for this cmd
            await m.react('📥');
        if (!args.length) {
            return m.reply(`📸 ɪɴsᴛᴀɢʀᴀᴍ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ\n\nᴜsᴀɢᴇ: .ɪɢᴅʟ <ɪɴsᴛᴀɢʀᴀᴍ ᴜʀʟ>\n\nexᴀᴍᴘʟᴇ: .ɪɢᴅʟ ʜᴛᴛᴘs://ᴡᴡᴡ.ɪɴsᴛᴀɢʀᴀᴍ.ᴄᴏᴍ/ʀᴇᴇʟ/xxxxxxxx`);
        }
        
        const url = args[0];
        
        if (!url.includes('instagram.com')) {
            return m.reply('❌ ᴘʟᴇᴀsᴇ ᴘʀᴏᴠɪᴅᴇ ᴀ ᴠᴀʟɪᴅ ɪɴsᴛᴀɢʀᴀᴍ ᴜʀʟ');
        }
        
        await m.reply(`⏳ ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ ɪɴsᴛᴀɢʀᴀᴍ ᴄᴏɴᴛᴇɴᴛ...`);
        
        try {
            const apiUrl = `https://api-rebix.zone.id/api/igdl?quality=480&url=${encodeURIComponent(url)}`;
            
            const response = await axios({
                method: 'get',
                url: apiUrl,
                timeout: 30000
            });
            
            if (!response.data.status || !response.data.result) {
                throw new Error('API returned error');
            }
            
            const result = response.data.result;
            const metadata = result.metadata;
            const mediaUrl = result.url[0];
            
            const mediaResponse = await axios({
                method: 'get',
                url: mediaUrl,
                responseType: 'arraybuffer',
                timeout: 60000
            });
            
            const buffer = Buffer.from(mediaResponse.data);
            
            const caption = `📸 *ɪɴsᴛᴀɢʀᴀᴍ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n` +
                           `👤 *ᴜsᴇʀ:* ${metadata.username}\n` +
                           `❤️ *ʟɪᴋᴇs:* ${metadata.like}\n` +
                           `💬 *ᴄᴏᴍᴍᴇɴᴛs:* ${metadata.comment}\n` +
                           `📝 *ᴄᴀᴘᴛɪᴏɴ:* ${metadata.caption || 'No caption'}\n\n` +
                           `> ᴘᴏᴡᴇʀᴇᴅ ʙʏ sᴀᴍᴜᴇʟ-ʀᴇʙɪx`;
            
            if (metadata.isVideo) {
                await m.reply(buffer, { 
                    caption: caption,
                    video: buffer,
                    mimetype: 'video/mp4'
                });
            } else {
                await m.reply(buffer, { 
                    caption: caption,
                    image: buffer
                });
            }
            
        } catch (err) {
            console.error('instadl error:', err);
            await m.reply(`❌ ғᴀɪʟᴇᴅ ᴛᴏ ᴅᴏᴡɴʟᴏᴀᴅ ɪɴsᴛᴀɢʀᴀᴍ ᴄᴏɴᴛᴇɴᴛ\n\n${err.message}`);
        }
    }
};
