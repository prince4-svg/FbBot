const chalk = require('chalk');
const util = require('util');

module.exports = {
    config: {
        name: 'MessageLogger',
        description: 'Logs new messages (data)',
        usage: 'Auto',
        author: 'Prince',
        role: 'Helper'        
    },
    
    onMessage: async function({ messageData, origLog, api }) {
		const { senderID } = messageData;
		
		messageData.name = (await api.getUserInfo(senderID)).name;
		
        const formattedData = util.inspect(messageData, { depth: 0, indent: 4 });
        
        origLog.log(chalk.green('\n\n[MESSAGE]'));
        origLog.info(formattedData, '\n');
    }    
};