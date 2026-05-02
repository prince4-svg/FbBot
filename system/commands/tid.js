module.exports = {
    config: {
        name: 'Tid',
        description: 'Show thread id.',
        usage: '[prefix]Tid',
        author: 'Prince',
        role: 0,
        coolDown: 5,
        aliases: ['threadid', 'thread']
    },
	
    onStart: async function({ messageData, send, addFont }) {
        const label = await addFont('Thread ID:', 'bold');
        await send(`${label} ${messageData.threadID}`);
    }
};