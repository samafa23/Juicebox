// import defined items w/ destructuring from the export in db/index.js
const { client,
    getAllUsers,
    createUser
} = require('./index');

// Create New Users function
async function createInitialUsers() {
    try {
        console.log("Starting to create users...");

        const albert = await createUser({ username: 'albert', password: 'bertie99' });
        const sandra = await createUser({ username: 'sandra', password: '2sandy4me' });
        const glamgal = await createUser({ username: 'glamgal', password: 'soglam' });

        console.log(albert, sandra, glamgal);

        console.log("Finished creating users!");
    } catch (error) {
        console.error("Error creating users!");
        throw error;
    }
}

// this function should call a query which drops all tables from our database

async function dropTables() {
    try {
        console.log("Starting to drop tables...");

        await client.query(`
        DROP TABLE IF EXISTS users;
        `);

        console.log("Finished dropping tables!");
    } catch (error) {
        console.error("Error dropping tables!");
        throw error; // we pass the error up to the function that calls
        //dropTables
    }
}

// this function should call a query which creates all tables for our database

async function createTables() {
    try {
        console.log("Starting to build tables...");

        await client.query(`
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            username varchar(255) UNIQUE NOT NULL,
            password varchar(255) NOT NULL
        );
        `);

        console.log("Finished building tables!");
    } catch (error) {
        console.error("Error building tables!");
        throw error; //passes error up to func that calls createTables
    }
}

async function rebuildDB() {
    try {
        // connect DB to the client
        client.connect();

        await dropTables();
        await createTables();
        await createInitialUsers();
    } catch (error) {
        throw error; //passes error up to func that calls createTables
    }
}

async function testDB() {
    try {
        console.log("Starting to test database...");

        // queries are promises, so we can await then
        const users = await getAllUsers();
        console.log("getAllUsers", users);
        // Asks for ALL* of the rows from the users table
        // const { rows } = await client.query(`SELECT * FROM users;`);

        console.log("Finished database tests!");
    } catch (error) {
        console.error("Error testing database!");
        throw error;
    }
}

rebuildDB() // activate func 
    .then(testDB) // run the promise
    .catch(console.error) // catch errors from the promise
    .finally(() => client.end()); //close the client!


// Our db/index.js file should provide the utility funtions that the rest of our
// application will use. We call them from the seed file, but also from our main
// application file.

// this is where we are going to listen to the front-end code making AJAX requests
// to certain routes && need to make our own requests to our DB.
