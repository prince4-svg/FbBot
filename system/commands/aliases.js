module.exports = {
    config: {
        name: 'aliases.js',
        description: 'Handle different aliases',
        usage: 'Auto',
        author: 'Prince',
        role: 'Helper'     
    },
    
    onMessage: async function({ systemData, messageData }) {
        const { saveData, getData } = systemData;
        const { prefix, commandsConfig, aliases } = getData();
        const { body } = messageData;
        
        let [targetCmd] = body.toLowerCase().split(' ');
        targetCmd = targetCmd.startsWith(prefix) ? targetCmd.slice(prefix.length) : targetCmd;
        
        saveData({ 'targetCmd': aliases[targetCmd] });
    }
};