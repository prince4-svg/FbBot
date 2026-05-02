module.exports = {
    config: {
        name: 'Announce',
        description: 'Announcement cmd',
        usage: '[prefix]Announce <msg>',
        author: 'Prince',
        role: 3,
        coolDown: 5,
        aliases: ['anc']
    },
	
    onStart: async function({ rawArgs, send, api, addFont }) {
        const msg = rawArgs.join(' ');
        if (!msg) {
            const errMsg = await addFont('Enter msg to send.', 'bold');
            await send(`⚠️ ${errMsg}`);
            return;
        };

        const threads = await api.getThreadList(20, null, 'INBOX');
        const groups = threads.filter(thread => thread.isGroup);

        if (!groups.length) {
            const errMsg = await addFont('No groups.', 'bold');
            await send(`⚠️ ${errMsg}`);
            return;
        };

        const line = '━━━━━━━━━━━━━━━━';
        const title = await addFont('ANNOUNCEMENT', 'bold');
        const msgBody = await addFont(msg, 'italic');
        const footer = await addFont('• PrinceDev', 'typewriter');
        const announcement = `❲ ${title} ❳ 📢\n${line}\n${msgBody}\n${line}\n${footer}`;

        let sentCount = 0;
        for (const group of groups) {
            await send(announcement, group.threadID, null);
            sentCount++;
            await new Promise(resolve => setTimeout(resolve, 5000));
        };

        const successText = await addFont(`Sent announcement to ${sentCount} group${sentCount > 1? 's' : ''}`, 'bold');
        await send(`✅️ ${successText}`);
    }
};