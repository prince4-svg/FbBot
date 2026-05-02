module.exports = {
    config: {
        name: 'AdminOnly',
        description: 'Toggle admin only mode.',
        usage: '[prefix]AdminOnly <on/off>',
        author: 'PrinceDev',
        role: 3,
        coolDown: 5,
        aliases: []    
    },
    
    onStart: async function({ rawArgs, systemData, send, addFont }) {
		const { saveData } = systemData;
		
		let action = rawArgs[0];
		if (!action) {
			await send('⚠️ Please enter your action');
			return;
		};
		
		action = action.toLowerCase();
		if (!['on', 'off'].includes(action)) {
			await send('⚠️ Invalid action.');
			return;
		};
		
		saveData({
			adminOnly: action == 'on'
		});
		
		const msg = action == 'on' ? '🔐 | Enabled! Only admin can use bot.' : '🔓 | Disabled! All can now use bot.';
		await send((await addFont(msg, 'typewriter')));
    },
	
	onMessage: async function({ systemData, messageData }) {
		const { getSavedData,  getData } = systemData;
		const { senderID } = messageData;
		
		const savedData = getSavedData();
		const { admins } = getData();
		
		const adminOnly = savedData.adminOnly;
		if (!adminOnly) {
			return;
		};
		
		if (!admins.includes(senderID)) {
			return 'exit';
		};
	}
};