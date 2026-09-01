module.exports = {
    name: 'kick',
    aliases: ['remove'],
    description: 'Kick a member from the group',
    enabled: true,

    async execute(sock, m, args) {
        try {
            if (!m.isGroup) {
                return await m.reply(
                    'ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ ᴏɴʟʏ ᴡᴏʀᴋs ɪɴ ɢʀᴏᴜᴘs.'
                );
            }

            if (!m.isAdmin && !m.isOwner) {
                return await m.reply(
                    'ᴏɴʟʏ ᴀᴅᴍɪɴs ᴏʀ ᴏᴡɴᴇʀs ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ.'
                );
            }

            const groupMetadata = m.groupMetadata;

            const participants = Array.isArray(groupMetadata?.participants)
                ? groupMetadata.participants
                : [];

            if (!participants.length) {
                return await m.reply(
                    'ᴄᴏᴜʟᴅ ɴᴏᴛ ғɪɴᴅ ɢʀᴏᴜᴘ ᴘᴀʀᴛɪᴄɪᴘᴀɴᴛs.'
                );
            }

            let targetJid = null;
            let targetParticipant = null;

            const mentionedJid =
                m.message?.extendedTextMessage?.contextInfo?.mentionedJid;

            if (mentionedJid?.length) {
                const mentioned = mentionedJid[0];

                targetParticipant = participants.find(
                    p => p.id === mentioned || p.phoneNumber === mentioned
                );

                if (targetParticipant) {
                    targetJid =
                        targetParticipant.phoneNumber ||
                        targetParticipant.id;
                }
            } else if (m.quoted) {
                const quotedSender = m.quoted.sender;

                targetParticipant = participants.find(
                    p =>
                        p.id === quotedSender ||
                        p.phoneNumber === quotedSender
                );

                if (targetParticipant) {
                    targetJid =
                        targetParticipant.phoneNumber ||
                        targetParticipant.id;
                } else {
                    targetJid = quotedSender;
                }
            } else if (args?.[0]) {
                const input = args[0].replace(/^@/, '').trim();

                targetParticipant = participants.find(p => {
                    const id = p.id?.split('@')[0];
                    const phone = p.phoneNumber?.split('@')[0];

                    return id === input || phone === input;
                });

                if (targetParticipant) {
                    targetJid =
                        targetParticipant.phoneNumber ||
                        targetParticipant.id;
                } else {
                    const cleanNumber = input.replace(/[^0-9]/g, '');

                    if (cleanNumber.length >= 7 && cleanNumber.length <= 15) {
                        targetJid = `${cleanNumber}@s.whatsapp.net`;

                        targetParticipant = participants.find(
                            p =>
                                p.phoneNumber === targetJid ||
                                p.id === targetJid
                        );
                    }
                }
            } else {
                return await m.reply(
                    'ʀᴇᴘʟʏ ᴛᴏ ᴀ ᴍᴇssᴀɢᴇ, ᴛᴀɢ ᴀ ᴜsᴇʀ, ᴏʀ ᴘʀᴏᴠɪᴅᴇ ᴀ ɴᴜᴍʙᴇʀ ᴏʀ ʟɪᴅ ᴛᴏ ᴋɪᴄᴋ.'
                );
            }

            if (!targetParticipant && targetJid) {
                targetParticipant = participants.find(
                    p =>
                        p.id === targetJid ||
                        p.phoneNumber === targetJid
                );
            }

            if (!targetParticipant) {
                return await m.reply(
                    'ᴄᴏᴜʟᴅ ɴᴏᴛ ɪᴅᴇɴᴛɪꜰʏ ᴛʜᴇ ᴜsᴇʀ ᴛᴏ ᴋɪᴄᴋ.'
                );
            }

            targetJid =
                targetParticipant.phoneNumber ||
                targetParticipant.id;

            const targetNumber =
                targetParticipant.phoneNumber?.split('@')[0] ||
                targetParticipant.id?.split('@')[0];

            const owners = Array.isArray(global.owner)
                ? global.owner
                : [global.owner];

            const isBotOwner = owners.some(owner => {
                const ownerNumber = String(owner)
                    .replace(/[^0-9]/g, '');

                return ownerNumber && ownerNumber === targetNumber;
            });

            if (isBotOwner) {
                return await m.reply(
                    'ʏᴏᴜ ᴄᴀɴɴᴏᴛ ᴋɪᴄᴋ ᴛʜᴇ ʙᴏᴛ ᴏᴡɴᴇʀ.'
                );
            }

            const senderJid = m.sender;

            const senderBase =
                senderJid?.split(':')[0]?.split('@')[0];

            const targetBase =
                targetJid?.split(':')[0]?.split('@')[0];

            if (senderBase && targetBase && senderBase === targetBase) {
                return await m.reply(
                    'ʏᴏᴜ ᴄᴀɴɴᴏᴛ ᴋɪᴄᴋ ʏᴏᴜʀsᴇʟꜰ.'
                );
            }

            const botJid = sock.user?.id;

            const botBase =
                botJid?.split(':')[0]?.split('@')[0];

            if (
                targetBase &&
                botBase &&
                targetBase === botBase
            ) {
                return await m.reply(
                    'ʏᴏᴜ ᴄᴀɴɴᴏᴛ ᴋɪᴄᴋ ᴛʜᴇ ʙᴏᴛ.'
                );
            }

            await sock.groupParticipantsUpdate(
                m.from,
                [targetJid],
                'remove'
            );

            await m.reply(
                'ᴜsᴇʀ ʜᴀs ʙᴇᴇɴ ᴋɪᴄᴋᴇᴅ ꜰʀᴏᴍ ᴛʜᴇ ɢʀᴏᴜᴘ.'
            );

        } catch (err) {
            console.error('Kick command error:', err);

            if (
                err?.message?.includes('403') ||
                err?.data === 403
            ) {
                return await m.reply(
                    'ɪ ᴅᴏ ɴᴏᴛ ʜᴀᴠᴇ ᴘᴇʀᴍɪssɪᴏɴ ᴛᴏ ᴋɪᴄᴋ ᴜsᴇʀs. ᴍᴀᴋᴇ sᴜʀᴇ ɪ ᴀᴍ ᴀɴ ᴀᴅᴍɪɴ.'
                );
            }

            if (
                err?.message?.includes('400') ||
                err?.data === 400
            ) {
                return await m.reply(
                    'ᴄᴀɴɴᴏᴛ ᴋɪᴄᴋ ᴛʜɪs ᴜsᴇʀ. ᴛʜᴇʏ ᴍɪɢʜᴛ ᴀʟʀᴇᴀᴅʏ ʙᴇ ʀᴇᴍᴏᴠᴇᴅ ᴏʀ ɴᴏᴛ ɪɴ ᴛʜᴇ ɢʀᴏᴜᴘ.'
                );
            }

            if (err?.message?.includes('text.match is not a function')) {
                console.log(
                    'Kick succeeded but reply failed due to formatting'
                );
                return;
            }

            await m.reply(
                'ꜰᴀɪʟᴇᴅ ᴛᴏ ᴋɪᴄᴋ ᴛʜᴇ ᴜsᴇʀ. ᴇʀʀᴏʀ: ' +
                (err?.message || 'ᴜɴᴋɴᴏᴡɴ ᴇʀʀᴏʀ')
            );
        }
    }
};
