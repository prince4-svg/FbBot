const path = require('path');


module.exports = {
    config: {
        name: 'Restart',
        description: 'Restart bot data.',
        usage: '[prefix]Restart',
        author: 'PrinceDev',
        role: 3,
        coolDown: 5,
        aliases: []    
    },
    
    onStart: async function({ systemData, send, api, addFont }) {
		const { loadCommands } = systemData;
		
		const restartingMess = await addFont('📦 Restarting...', 'italic');
		const { messageID } = await send(restartingMess);
		
		await new Promise(r => setTimeout(r, 3000));
		
		const cmdsPath = path.join(__dirname, 'commands');
		loadCommands(cmdsPath);
		
		const { commandsConfig }= systemData.getData();
		const loadedCount = Object.keys(commandsConfig).length;
		
		const loadedMsg = await addFont(`📦 Loaded: ${loadedCount} cmds`, 'italic');
		await api.editMessage(loadedMsg, messageID);
    }
};