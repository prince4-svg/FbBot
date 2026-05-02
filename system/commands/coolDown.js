module.exports = {
    config: {
        name: 'coolDown.js',
        description: 'Cools down command',
        usage: 'Auto',
        author: 'Prince',
        role: 'Helper'      
    },
    
    onMessage: async function({ rawArgs, messageData, systemData, send }) {
        const { senderID, body } = messageData;
        const { prefix, commandsConfig } = systemData.getData();
        const { saveData, getSavedData } = systemData;
        
        const savedData = getSavedData();
        
        const [targetCmd] = (body.startsWith(prefix) ? body.slice(prefix.length) : body).split(' ');
        const targetCmdLower = targetCmd.toLowerCase()                                                                
        if (targetCmdLower in commandsConfig) {
            const { coolDown } = commandsConfig[targetCmdLower].config;
            
            const commandUsagesHistory = savedData.usagesHistory?.[targetCmdLower];            
            const commandLastUsage = commandUsagesHistory?.[senderID]?.lastUse;
            
            let minOffsetUsage = null;
            if (commandLastUsage) {
                minOffsetUsage = (new Date() - commandLastUsage) / 1000;
            };
            
            if (!minOffsetUsage || minOffsetUsage >= coolDown) {                                
                saveData({
                    usagesHistory: {
                        ...(savedData.usagesHistory || {}),
                        
                        [targetCmdLower]: {
                            ...(commandUsagesHistory || {}),
                            [senderID]: { lastUse: new Date() }
                        }
                    }
                });
            }
            
            else {
                await send(`⏳️ Command ${targetCmd} on cooldown! Try again after ${Math.round(coolDown - minOffsetUsage)} sec`);
                return 'exit';
            };
        };
    }        
};