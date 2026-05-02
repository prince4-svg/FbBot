async function showWhole(send, bal, serverFunc, addFont, origLog) {
	const res = await serverFunc(null, null, {
		bal
	}, null, 'get_whole');
	
	if (!res.success) {
		if (!res.exit) {
			origLog.log(res.error);
			await send('⚠️ An error occured');
			
			return;
		};
		
		await send("⚠️ Balance too big!! Facebook can't render");
		return;
	};
	
	const line = '━━━━━━━━━━━━━━━';
	const balHeader = await addFont('💵 Balance', 'bold');
	await send(`${balHeader}\n${line}\n${res.value}`);
};


async function showFormated(send, bal, addFont) {
	bal = await addFont(`💰 Balance: $${bal}`, 'italic');
	await send(bal);
};


module.exports = {
    config: {
        name: 'Bal',
        description: 'Show user balance.',
        usage: '[prefix]Bal or [prefix]Bal s',
        author: 'PrinceDev',
        role: 0,
        coolDown: 5,
        aliases: []    
    },
    
    onStart: async function({ rawArgs, messageData, systemData, send, addFont, origLog }) {
		const { senderID } = messageData;
		const { serverFunc } = systemData;
		
		const res = await serverFunc('users', 'GET', {
			columns: ['bal'],
			condition: 'WHERE id=?',
			values: [senderID]
		});
		const [bal] = res.data;
		
		const action = rawArgs[0];
		if (!action) {
			await showFormated(send, bal, addFont);
			return;
		};
		
		if (action.toLowerCase() !== 's') {
			await send('⚠️ Invalid action. Try "bal" or "bal s"');
			return;
		};
		
		await showWhole(send, bal, serverFunc, addFont, origLog);
    }
};