const fs = require('fs');
const path = require('path');

function loadOwners() {
    try {
        const configPath = path.join(__dirname, '..', 'config.json');
        if (fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            if (Array.isArray(config.owners)) {
                if (!Array.isArray(global.owners)) global.owners = [];
                for (const o of config.owners) {
                    if (!global.owners.includes(o)) {
                        global.owners.push(o);
                    }
                }
            }
        }
    } catch (e) {}
}

function saveOwners() {
    try {
        const configPath = path.join(__dirname, '..', 'config.json');
        let config = {};
        if (fs.existsSync(configPath)) {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
        config.owners = Array.from(new Set(global.owners));
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    } catch (e) {
        console.error('Failed to save owners:', e);
    }
}

loadOwners();

module.exports = {
    name: 'addowner',
    aliases: ['delowner', 'removeowner', 'owners', 'listowner'],
    description: 'Add or remove bot owners',
    tags: ['owner'],

    async execute(sock, m, args = []) {
        const fullCmd = m.body.slice(global.BOT_PREFIX.length).trim().split(/\s+/)[0]?.toLowerCase() || '';
        const subCmd = args[0]?.toLowerCase();

        const isList = fullCmd === 'owners' || fullCmd === 'listowner' || subCmd === 'list';
        const isRemove = fullCmd === 'delowner' || fullCmd === 'removeowner' || subCmd === 'remove' || subCmd === 'del';

        if (isList) {
            if (!global.owners || global.owners.length === 0) {
                return m.reply('No owners configured.');
            }
            const unique = Array.from(new Set(global.owners));
            let list = '*👑 Bot Owners*\n\n';
            unique.forEach((owner, i) => {
                const number = owner.split('@')[0];
                list += `${i + 1}. @${number}\n`;
            });
            return m.reply(list, { mentions: unique });
        }

        const sender = m.sender || '';
        const senderNumber = sender.split('@')[0].split(':')[0];
        const botNumber = sock.user?.id?.split('@')[0]?.split(':')[0];

        const isOwner = m.isOwner ||
            senderNumber === botNumber ||
            (global.owners || []).some(o => o.split('@')[0].split(':')[0] === senderNumber);

        if (!isOwner) {
            return m.reply('❌ Only owners can use this command.');
        }

        let target = null;

        if (m.quoted) {
            target = m.quoted.participant || m.quoted.sender || m.quoted.key?.participant;
        } else if (m.mentionedJid && m.mentionedJid.length > 0) {
            target = m.mentionedJid[0];
        } else {
            const raw = (subCmd === 'add' || subCmd === 'remove' || subCmd === 'del') ? args[1] : args[0];
            if (raw) {
                const clean = raw.replace(/[@\s]/g, '');
                if (/^\d+$/.test(clean)) {
                    target = clean + '@s.whatsapp.net';
                } else if (clean.includes('@')) {
                    target = clean;
                }
            }
        }

        if (!target) {
            return m.reply(
                `Usage:\n` +
                `• ${global.BOT_PREFIX}addowner @user (or reply to a message)\n` +
                `• ${global.BOT_PREFIX}delowner @user (or reply to a message)\n` +
                `• ${global.BOT_PREFIX}owners (list all owners)`
            );
        }

        target = target.split(':')[0];
        if (!target.includes('@')) {
            target = `${target}@s.whatsapp.net`;
        }

        const targetNumber = target.split('@')[0];

        if (isRemove) {
            if (targetNumber === senderNumber || targetNumber === botNumber) {
                return m.reply('❌ You cannot remove yourself or the bot from owners.');
            }

            const exists = (global.owners || []).some(o => o.split('@')[0] === targetNumber);
            if (!exists) {
                return m.reply(`⚠️ @${targetNumber} is not an owner.`, { mentions: [target] });
            }

            global.owners = (global.owners || []).filter(o => o.split('@')[0] !== targetNumber);
            saveOwners();

            return m.reply(`✅ Removed @${targetNumber} from owners.`, { mentions: [target] });
        } else {
            const alreadyOwner = (global.owners || []).some(o => o.split('@')[0] === targetNumber);
            if (alreadyOwner) {
                return m.reply(`⚠️ @${targetNumber} is already an owner.`, { mentions: [target] });
            }

            if (!Array.isArray(global.owners)) global.owners = [];
            global.owners.push(target);
            saveOwners();

            return m.reply(`✅ Added @${targetNumber} as owner.`, { mentions: [target] });
        }
    }
};
