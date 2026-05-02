module.exports = {
    config: {
        name: 'Uptime',
        description: 'Check bot uptime',
        usage: '[prefix]Uptime',
        author: 'Prince',
        role: 0,
        coolDown: 5,
        aliases: ['up', 'uptime']
    },
	
    onStart: async function({ send, addFont }) {
        const uptime = process.uptime();

        const seconds = Math.floor(uptime % 60);
        const minutes = Math.floor((uptime / 60) % 60);
        const hours = Math.floor((uptime / 3600) % 24);
        const days = Math.floor(uptime / 86400);

        let uptimeStr = '';
        if (days > 0) uptimeStr += `${days}d `;
        if (hours > 0) uptimeStr += `${hours}h `;
        if (minutes > 0) uptimeStr += `${minutes}m `;
        uptimeStr += `${seconds}s`;

        const line = '━━━━━━━━━━━━━━';
        const title = await addFont('BOT UPTIME', 'bold');
        const timeText = await addFont(uptimeStr, 'typewriter');
        const statusText = await addFont('Status: Online', 'bold');

        const uptimeBody = `⏱️ ❲ ${title} ❳ ⏱️\n${line}\n🟢 ${statusText}\n⏰ ${timeText}\n${line}`;
        await send(uptimeBody);
    }
};