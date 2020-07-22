
// import Postgres
const { Client } = require('pg');

// Call in the desired database and its location
const client = new Client('postgres://localhost:5432/juicebox-dev');

// HELPER FUNCTION:
async function getAllUsers() {

    // Grabs the destructured rows from the client, 
    // and asks for the id & username from the users table
    const { rows } = await client.query(
        `SELECT id, username
        FROM users;`
    );

    return rows;
}

// So Empty - Function

async function createUser({ username, password }) {
    try {
        const { rows } = await client.query(`
            INSERT INTO users(username, password) 
            VALUES ($1, $2)
            ON CONFLICT (username) DO NOTHING
            RETURNING *;
        `, [username, password]);

        return rows
    } catch (error) {
        throw error;
    }
}

// Exports contents, so they may be imported and used elsewhere
module.exports = {
    client,
    getAllUsers,
    createUser
}

