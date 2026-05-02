module.exports = {
    config: {
        name: 'Roles',
        description: 'Handles commands roles',
        usage: 'Auto',
        author: 'PrinceDev',
		role: 'Helper'
    },
    
    onMessage: async function({ systemData, messageData, api, send }) {
		const { getData, saveData, getSavedData } = systemData;
        const { prefix, commandsConfig, aliases, admins } = getData();
        const { body,  senderID, threadID } = messageData;
		const { getThreadInfo } = api;
		
		const savedData = getSavedData();
        
        let [targetCmd] = body.toLowerCase().split(' ');
        targetCmd = targetCmd.startsWith(prefix) ? targetCmd.slice(prefix.length) : targetCmd;
		
		const cmd = aliases[targetCmd] || targetCmd;
		if (!(cmd in commandsConfig)) {
			return;
		};
		
		const config = commandsConfig[cmd].config;
		
		let msg;
		switch (config.role) {
			case 3:
				if (!admins.includes(senderID)) {
					msg = '❌️ | You dont have permission to use this command.';
				};
				
				break;
		
			case 2:
				const threadAdmins = savedData.threadAdmins || {};
				
				let adminIDs = threadAdmins[threadID];
				if (!adminIDs) {
					const threadInfo = await getThreadInfo(threadID);
					adminIDs = threadInfo.adminIDs.map(obj => obj.id);
					
					threadAdmins[threadID] = adminIDs;
					
					saveData({
						threadAdmins
					});
				};	
		
				if (!admins.includes(senderID) && !adminIDs.includes(senderID)) {
					msg = '❌️ | Only admins of chat box and bot admins can use this.';
				};
				
				break;
				
			default:
				break;	
		};
		
		if (msg) {
			await send(msg);
			return 'exit';
		};
    }
};