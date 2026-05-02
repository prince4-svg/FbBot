module.exports = {
    config: {
        name: 'Top',
        description: 'Show top users by total wealth',
        usage: '[prefix]top <count>',
        author: 'PrinceDev',
        role: 0,
        coolDown: 5,
        aliases: ['highest', 'leader-board']
    },
	
    onStart: async function({ api, rawArgs, send, systemData, messageData, addFont }) {
        const { serverFunc, helpers } = systemData;
        const { calculate, compare } = helpers;

        let count = Number(rawArgs[0]) || 10;
        if (!Number.isFinite(count) || count <= 0) {
            await send(`⚠️ ${await addFont('Enter a valid positive top count', 'bold')}`);
            return;
        };

        const result = await serverFunc('users', 'GET', { columns: ['name', 'bal', 'bank'], fetch_state: 'ALL' });
        if (!result.success) {
            await send(`❌ ${await addFont('DB Error:', 'bold')} ${result.error}`);
            return;
        };

        const users = [];
        for (const row of result.data) {
            const [name, bal, bank] = row;
            const total = await calculate(send, bal, 'add', bank);
            if (total === 'exit') return;
            users.push({ name, bal, bank, total });
        };

        for (let i = 0; i < users.length; i++) {
            for (let j = i + 1; j < users.length; j++) {
                const cmp = await compare(send, users[i].total, users[j].total);
                if (cmp < 0) [users[i], users[j]] = [users[j], users[i]];
            };
        };

        const topUsers = users.slice(0, count);
        count = topUsers.length;

        if (!topUsers.length) {
            const noTop = await addFont('TOP RICHEST', 'bold');
            await send(`🏆 ${noTop}\n— No top users`);
            return;
        };

        let topBody = `🏆 ${await addFont(`TOP ${count} RICHEST`, 'bold')}`;

        for (let i = 0; i < topUsers.length; i++) {
            const user = topUsers[i];
            const rank = await addFont(`${i + 1}`, 'bold');
            const nameLabel = await addFont('Name:', 'serif');
            const balLabel = await addFont('Bal:', 'serif');
            const bankLabel = await addFont('Bank:', 'serif');
            const totalLabel = await addFont('Total:', 'serif');

            topBody += `\n━━━━━━ ${rank} ━━━━━━━\n`;
            topBody += `🏷 ${nameLabel} ${user.name}\n`;
            topBody += `💵 ${balLabel} $${user.bal}\n`;
            topBody += `🏦 ${bankLabel} $${user.bank}\n`;
            topBody += `💰 ${totalLabel} $${user.total}\n`;
        };

        await send(topBody);
    }
};