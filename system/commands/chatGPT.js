export default {
    config: {
        name: "Gpt",
        author: "PrinceDev",
        description: "gpt command.",
        usage: "[prefix]gpt <query>",
        role: 0,
		coolDown: 5
	},
	
    onStart: async function ({ send, react, rawArgs }) {
        if (!rawArgs) {
            await send("⚠️ Please enter your question.");
            return;
        };

        const query = rawArgs;
        const url = `https://urangkapolka.vercel.app/api/chatgpt4?prompt=${encodeURIComponent(query)}`;

        try {
            await react("🔎");
            const res = await fetch(url);
            const data = await res.json();
            const answer = data?.response;

            if (!answer) {
                await send("⛔️ No answer found");
                return;
            };

            await send(answer);
        }
		
		catch (err) {
            await send(`⚠️ Unknown error occured.\n⚠️ [ ai ]: ${err.message}`);
        };
    }
};