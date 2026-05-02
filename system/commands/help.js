async function helpCmdsList(send, prefix, commandsConfig, addFont) {
    const line = '━━━━━━━━━━━━━━';
    const title = await addFont('Commands', 'bold');
    let listBody = `📚 ❲ ${title} ❳ 📚\n${line}\n`;

    for (const [commandKey, commandConfig] of Object.entries(commandsConfig)) {
        const { name } = commandConfig.config;
        listBody += `╰•➤ ${name}\n`;
    };

    const sysPrefix = await addFont(`System Prefix: ${prefix}`, 'italic');
    const totalCmds = await addFont(`Total Cmds: ${Object.keys(commandsConfig).length}`, 'italic');
    listBody += `\n🛸 ${sysPrefix}\n🗂 ${totalCmds}\n${line}`;

    const noteText = await addFont(`Note: Type '${prefix}Help <command>' for command information`, 'italic');
    listBody += `\n📍 ${noteText}`;
    await send(listBody);
};


async function helpCmdInfo(commandConfig, prefix, send, addFont) {
    let { name, description, usage, author, role, coolDown, aliases } = commandConfig.config;
    usage = usage.replace(/\[prefix\]/g, prefix);
    const line = '━━━━━━━━━━━━━━';

    const title = await addFont('Info', 'bold');
    const nameText = await addFont(`Name: ${name}`, 'bold');
    const descText = await addFont(`Description: ${description}`, 'italic');
    const cdText = await addFont(`Cooldown: ${coolDown}`, 'italic');
    const usageText = await addFont(`Usage: ${usage}`, 'italic');
    const aliasText = await addFont(`Aliases: ${aliases.join(', ') || 'None'}`, 'italic');
    const authorText = await addFont(`Author: ${author}`, 'italic');
    const roleText = await addFont(`Role: ${role}`, 'italic');

    const infoBody = `📁 ❲ ${title} ❳ 📁\n${line}\n✏️ ${nameText}\n📑 ${descText}\n⏱️ ${cdText}\n🛰 ${usageText}\n🔤 ${aliasText}\n👑 ${authorText}\n🌐 ${roleText}\n${line}`;
    await send(infoBody);
};


module.exports = {
    config: {
        name: 'Help',
        description: 'See all cmds and info',
        usage: '[prefix]Help or [prefix]Help <command>',
        author: 'Prince',
        role: 0,
        coolDown: 5,
        aliases: ['cmds']
    },
	
    onStart: async function({ send, systemData, rawArgs, addFont }) {
        const { commandsConfig, prefix } = systemData.getData();
        let targetCmd = rawArgs[0];

        if (!targetCmd) {
            await helpCmdsList(send, prefix, commandsConfig, addFont);
        }
		
		else {
            targetCmd = targetCmd.toLowerCase();
            if (!(targetCmd in commandsConfig)) {
                const errMsg = await addFont('Command not found.', 'bold');
                await send(`⚠️ ${errMsg}`);
                return;
            };
			
            await helpCmdInfo(commandsConfig[targetCmd], prefix, send, addFont);
        };
    },
	
    onMessage: async function({ send, systemData, messageData, rawArgs, addFont }) {
        const { commandsConfig, prefix } = systemData.getData();
        let [Cmd] = messageData.body?.toLowerCase().split(' ');

        if (Cmd === 'help') {
            let targetCmd = rawArgs[0];
            if (!targetCmd) {
                await helpCmdsList(send, prefix, commandsConfig, addFont);
            }
			
			else {
                targetCmd = targetCmd.toLowerCase();
                if (!(targetCmd in commandsConfig)) {
                    const errMsg = await addFont('Command not found.', 'bold');
                    await send(`⚠️ ${errMsg}`);
                    return;
                };
				
                await helpCmdInfo(commandsConfig[targetCmd], prefix, send, addFont);
            };
        };
    }
};