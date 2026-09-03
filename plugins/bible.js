const fetch = require('node-fetch');
module.exports={
name:'bible',aliases:['verse','scripture','kjv'],
description:'Get any Bible verse — free, no setup needed. E.g. .bible John 3:16',
async execute(sock,m,args){
    if(!args.length) return m.reply('Usage: .bible <Book> <Chapter>:<Verse>\n\nExamples:\n.bible John 3:16\n.bible Psalm 23:1\n.bible Romans 8:28\n.bible Genesis 1:1\n.bible Proverbs 3:5-6');
    const ref=args.join(' ');
    await m.react('⏳');
    try{
        const r=await fetch('https://bible-api.com/'+encodeURIComponent(ref)+'?translation=kjv');
        const d=await r.json();
        if(d.error) return m.reply('Verse not found: '+ref+'\nCheck the book name and reference format.');
        const verses=d.verses.map(v=>'['+v.chapter+':'+v.verse+'] '+v.text.trim()).join('\n');
        await m.reply('📖 *'+d.reference+'*\n\n'+verses+'\n\n— KJV Bible');
        await m.react('✅');
    }catch(e){await m.react('❌');await m.reply('Could not fetch verse. Check the reference and try again.');}
}};
