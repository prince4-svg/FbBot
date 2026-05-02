module.exports = {
    config: {
        name: 'Post',
        description: 'Create a fb post.',
        usage: '[prefix]Post <message>',
        author: 'Prince',
        role: 3,
        coolDown: 5,
        aliases: []
    },
	
    onStart: async function({ rawArgs, send, api, messageData }) {
        const { threadID, messageID } = messageData;
        const msg = rawArgs.join(' ');

        if (!msg) {
			send('⚠️ Enter message to post.');
			return
		};

        try {
            const post = await api.createPost(msg);
            await send(`✅️ Posted successfully.\nPostID: ${post?.legacy_story_hideable_id || 'N/A'}`, threadID, messageID);
        }
		
		catch (err) {
            console.error("createPost error:", err);
            const errorMsg = err?.error || err?.message || err?.err || JSON.stringify(err);
            await send(`❌ Failed to post: ${errorMsg}`, threadID, messageID);
        };
    }
};