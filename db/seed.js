// import defined items w/ destructuring from the export in db/index.js
const { client,
    getAllUsers,
    createUser,
    updateUser,
    createPost,
    getAllPosts,
    updatePost,
    getPostsByUser,
    getUserById
} = require('./index');

// DROP TABLES
// this function should call a query which drops all tables from our database

async function dropTables() {
    try {
        console.log("Starting to drop tables...");

        await client.query(`
        DROP TABLE IF EXISTS posts;
        DROP TABLE IF EXISTS users;
        `);

        console.log("Finished dropping tables!");
    } catch (error) {
        console.error("Error dropping tables!");
        throw error; // we pass the error up to the function that calls
        //dropTables
    }
}

// CREATE TABLES
// this function should call a query which creates all tables for our database
async function createTables() {
    try {
        console.log("Starting to build tables...");
        //create users and posts table in psql
        await client.query(`
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            username varchar(255) UNIQUE NOT NULL,
            password varchar(255) NOT NULL,
            name varchar(255) NOT NULL,
            location varchar(255),
            active BOOLEAN DEFAULT true
        );
        CREATE TABLE posts (
            id SERIAL PRIMARY KEY,
            "authorId" INTEGER REFERENCES users(id),
            title varchar(255) NOT NULL,
            content TEXT NOT NULL,
            active BOOLEAN DEFAULT true
        );
        `);

        console.log("Finished building tables!");
    } catch (error) {
        console.error("Error building tables!");
        throw error; //passes error up to func that calls createTables
    }
}

// Create New Users function
async function createInitialUsers() {
    try {
        console.log("Starting to create users...");

        await createUser({
            username: 'albert',
            password: 'bertie99',
            name: 'Newname Sogood',
            location: 'Lesterville, KY'
        });
        await createUser({
            username: 'sandra',
            password: '2sandy4me',
            name: 'Just Sandra',
            location: "Ain't tellin'"
        });
        await createUser({
            username: 'glamgal',
            password: 'soglam',
            name: 'Joshua',
            location: 'Upper East Side'
        });

        console.log("Finished creating users!");
    } catch (error) {
        console.error("Error creating users!");
        throw error;
    }
}

// Create New Posts function

async function createInitialPosts() {
    try {
        const [albert, sandra, glamgal] = await getAllUsers();

        await createPost({
            authorId: albert.id,
            title: "First Post",
            content: "This is my first post. I love this blog!"
        });

        await createPost({
            authorId: sandra.id,
            title: "Tales of pranking my husband",
            content: "I decided to use this blog to catalog my legendary pranks. Featuring my husband and friends"
        });

        await createPost({
            authorId: glamgal.id,
            title: "The 1st step to Glam Goddess - a blog",
            content: "Whats the new black? Don't worry, allow me to tell you. Glitter Cat-eye liner, my Queens!"
        });
    } catch (error) {
        console.log("Error creating posts!");
        throw error;
    }
}
// REBUILD DATABASE
async function rebuildDB() {
    try {
        // connect DB to the client
        client.connect();

        await dropTables();
        await createTables();
        await createInitialUsers();
        await createInitialPosts();
    } catch (error) {
        throw error; //passes error up to func that calls createTables
    }
}

async function testDB() {
    try {
        console.log("Starting to test database...");

        // queries are promises, so we can await then
        console.log("Calling getAllUsers");
        const users = await getAllUsers();
        console.log("getAllUsers", users);
        // Asks for ALL* of the rows from the users table
        // const { rows } = await client.query(`SELECT * FROM users;`);

        console.log("Calling updateUser on users[0]");
        const updateUserResult = await updateUser(users[0].id, {
            name: "Newname Sogood",
            location: "Lesterville, KY"
        });
        console.log("Result:", updateUserResult);


        console.log("Calling getAllPosts");
        const posts = await getAllPosts();
        console.log("Result:", posts);


        console.log("Calling updatePost on posts[0]");
        const updatePostResult = await updatePost(posts[0].id, {
            title: "New Title",
            content: "Updated Content"
        });
        console.log("Result:", updatePostResult);

        console.log("Calling getUserById with 1");
        const albert = await getUserById(1);
        console.log("Result:", albert);

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
