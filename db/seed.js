// import defined items w/ destructuring from the export in db/index.js
const { client,
    getAllUsers,
    createUser,
    updateUser,
    createPost,
    getAllPosts,
    updatePost,
    getUserById,
    getAllTags,
    getPostsByTagName
} = require('./index');

// SEEDING
// This file is to give us a mock-up of data to build and construct
// our database, rather than connecting directly to the SQL server
// and durectly typing in queries by hand. It doesn't say why
// that would be a bad thing? So my guess would be that it just 
// takes longer and requires more code than neccessary? 
// I'd like to understand that better. 

// DROP TABLES
// this function should call a query which drops all tables from our database

// I believe this function is being used to "cleanse" the server in 
// a sense and reset the tables to the original data of when
// we created it. ie. in createInitialUsers Alberts location is set to
// sidney austraila, but from a previous test on the functionality 
// of our databaseit would have the update value of Lesterville, KY.
// this is so we can make sure all of our functions
// continously work as we build our database. Seeing as we arent supposed
// to re-edit often the core of our database we use the Seeding method
// to ensure the first deploy will not need to have modifcations done on the 
// database. 
async function dropTables() {
    try {
        console.log("Starting to drop tables...");

        // We drop in this order specifically because
        // post_tags relies on tags and tags relies on posts and posts relies on users
        // therefore deleting wouldnt be possible if relevant data was still being pulled from it
        await client.query(`
        DROP TABLE IF EXISTS post_tags;
        DROP TABLE IF EXISTS tags;
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
            location varchar(255) NOT NULL,
            active BOOLEAN DEFAULT true
        );
        CREATE TABLE posts (
            id SERIAL PRIMARY KEY,
            "authorId" INTEGER REFERENCES users(id),
            title varchar(255) NOT NULL,
            content TEXT NOT NULL,
            active BOOLEAN DEFAULT true
        );
        CREATE TABLE tags (
            id SERIAL PRIMARY KEY,
            name varchar(255) UNIQUE NOT NULL
        );
        CREATE TABLE post_tags (
            "postId" INTEGER REFERENCES posts(id),
            "tagId" INTEGER REFERENCES tags(id),
            UNIQUE ("postId", "tagId")
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
            name: 'Al Bert',
            location: 'Sidney, Australia'
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
            content: "This is my first post. I love this blog!",
            tags: ["#happy", "#youcandoanything"]
        });

        await createPost({
            authorId: sandra.id,
            title: "Tales of pranking my husband",
            content: "I decided to use this blog to catalog my legendary pranks. Featuring my husband and friends",
            tags: ["#happy", "#worst-day-ever"]
        });

        await createPost({
            authorId: glamgal.id,
            title: "The 1st step to Glam Goddess - a blog",
            content: "Whats the new black? Don't worry, allow me to tell you. Glitter Cat-eye liner, my Queens!",
            tags: ["#happy", "#youcandoanything", "#canmandoeverything"]
        });
    } catch (error) {
        console.log("Error creating posts!");
        throw error;
    }
}

// CREATE INITIAL TAGS

// async function createInitialTags() {
//     try {
//         console.log("Starting to create tags...");

//         const [happy, sad, inspo, catman] = await createTags([
//             '#happy',
//             '#worst-day-ever',
//             '#youcandoanything',
//             "#catmandoeverything"
//         ]);

//         const [postOne, postTwo, postThree] = await getAllPosts();

//         await addTagsToPost(postOne.id, [happy, inspo]);
//         await addTagsToPost(postTwo.id, [sad, inspo]);
//         await addTagsToPost(postThree.id, [catman, inspo]);

//         console.log("Finished Creating Tag's!");
//     } catch (error) {
//         console.log("Failed to make first tags");
//         throw error;
//     }
// }
// REBUILD DATABASE
async function rebuildDB() {
    try {
        // connect DB to the client
        client.connect();

        //The FIRST part of the Sequence: 
        await dropTables(); // Drop the tables so ALL of the functions can be reran on a clean slate and ensure they work.
        await createTables(); // create new tables - does it work?
        await createInitialUsers(); // Great put users in those tables
        await createInitialPosts(); // Now that we have users, lets give them some posts!
        // await createInitialTags(); // Lets add tags to our posts!
    } catch (error) {
        throw error; //passes error up to func that calls createTables
    }
}

// THE SECONNNDDD PART OF THE SEQUENCE: (please follow the numbers)
async function testDB() {
    try {
        console.log("Starting to test database...");

        // 1. Grab your users

        // queries are promises, so we can await then
        console.log("Calling getAllUsers");
        const users = await getAllUsers();
        console.log("getAllUsers", users);
        // Asks for ALL* of the rows from the users table
        // const { rows } = await client.query(`SELECT * FROM users;`);


        // 2. Does your users have any new updates?  if so make them!
        console.log("Calling updateUser on users[0]");
        const updateUserResult = await updateUser(users[0].id, {
            name: "Newname Sogood",
            location: "Lesterville, KY"
        });
        console.log("Result:", updateUserResult);

        // 3. Great, now lets grab all of our posts and check them too!
        console.log("Calling getAllPosts");
        const posts = await getAllPosts();
        console.log("Result:", posts);

        // 4. Now that you have them, do they have updates? if so make them!
        console.log("Calling updatePost on posts[0]");
        const updatePostResult = await updatePost(posts[0].id, {
            title: "New Title",
            content: "Updated Content"
        });
        console.log("Result:", updatePostResult);

        console.log("Calling updatePost on posts[1], only updating tags");
        const updatePostTagsResult = await updatePost(posts[0].id, {
            tags: ["#youcandoanything", "#redfish", "#bluefish"]
        });
        console.log("Result:", updatePostTagsResult);

        // 5. get the user by the id and lets see those updates!!!
        console.log("Calling getUserById with 1");
        const albert = await getUserById(1);
        console.log("Result:", albert);

        console.log("Calling getAllTags");
        const allTags = await getAllTags();
        console.log("Result:", allTags);

        console.log("Calling getPostsByTagName with #happy");
        const postsWithHappy = await getPostsByTagName("#happy");
        console.log("Result:", postsWithHappy);


        console.log("Finished database tests!");
    } catch (error) {
        console.error("Error testing database!");
        throw error;
    }
}

// This is why Rebuild is the first part of the sequence, and test db is second
// First we rebuild our data base with tables and users and posts with
// in terms of science this would be our constant. And test DB would be our variable
// making changes to our constant so we can view the outcome analyze
// and work to a better solution :D
rebuildDB() // activate func 
    .then(testDB) // run the promise
    .catch(console.error) // catch errors from the promise
    .finally(() => client.end()); // ALWAYS close the client!


// Our db/index.js file should provide the utility funtions that the rest of our
// application will use. We call them from the seed file, but also from our main
// application file.

// this is where we are going to listen to the front-end code making AJAX requests
// to certain routes && need to make our own requests to our DB.
