const axios = require('axios');


async function serverFunc(table, action, data, db_name = 'users-data.db', route = 'databases') {
    try {
        const res = await axios.post(`http://localhost:6000/${route}`, {
            table,
            action,
            data,
            db_name
        });
		
        return res.data;
    }
	
	catch (err) {
        if (err.response && err.response.data) {
            return err.response.data;
        };
		
        throw err;
    };
};

module.exports = serverFunc;