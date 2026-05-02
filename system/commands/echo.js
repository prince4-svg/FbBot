module.exports = {
    config: {
        name: 'Echo',
        description: 'Let bot echo a text',
        usage: '[prefix]Say <text>',
        author: 'Prince',
        role: 0,
        coolDown: 5,
        aliases: ['repeat']    
    },
    
    onStart: async function({ send, rawArgs }) {
        const text = rawArgs.slice().join(' ');
        if (!text) {
            await send('⚠️ Enter your text');
            return;
        };
        
        await send(text);
    }
};