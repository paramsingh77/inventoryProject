require('dotenv').config();
const { initializeSchema } = require('../database/schema');

const initDb = async () => {
    try {
        await initializeSchema();
        console.log('Database schema initialized successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error initializing database schema:', error);
        process.exit(1);
    }
};

initDb(); 