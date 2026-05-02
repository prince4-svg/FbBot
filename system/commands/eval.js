const util = require('util');


module.exports = {
  config: {
    name: 'Eval',
    description: 'Execute js codes',
    usage: '[prefix]eval <code>',
    author: 'Prince',
    role: 3,
    coolDown: 5,
    aliases: ['exec']
  },
  
  onStart: async function({ rawArgs, messageData, api, systemData, send, unsend, react, botID, origLog, addFont }) {
    let { body } = messageData;
    body = body.replace(/#(eval|exec)/i, '');
    const code = body.trim();

    if (!code) {
		send('⚠️ Enter code to execute.');
		return;
	};

    const logs = [];
    const realLog = origLog.log;

    console.log = (...args) => {
      for (let arg of args) {
        if (typeof arg === 'object' && arg!== null) {
          arg = util.inspect(arg, { depth: 1, indent: 4 });
        }
        logs.push(String(arg));
        realLog(arg);
      }
    };

    const outputBase = '💻 EVAL 💻\n';
    let result;
	
    try {
      const executer = `(async () => { ${code} })()`;
      result = await eval(executer);
      if (result === undefined) result = 'NO OUTPUT';

      let output = '';
      result = String(result);
      if (result.length > 3000) result = result.slice(0, 3000) + '\n\n[TRUNCATED]';
      output += 'OUTPUTS:\n' + result;

      if (logs.length) {
        if (result!== 'NO OUTPUT') output += '\n\n';
        output += 'LOGS:\n' + logs.join('\n');
      }

      await send(outputBase + output);
    }
	
	catch (err) {
      await send(`${outputBase}Error: ${err.stack}`);
    }
	
	finally {
      console.log = realLog;
    };
  }
};