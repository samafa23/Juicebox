
// import Postgres
const { Client } = require('pg');

// Call in the desired database and its location
const client = new Client('postgres://localhost:5432/juicebox-dev');

// USERS
// CREATE USER

async function createUser({
    username,
    password,
    name,
    location }) {
    try {
        // this calls rows array to grab it's user object,
        // defined by grabbing the values of the keys within the selected table
        const { rows: [user] } = await client.query(`
            INSERT INTO users(username, password, name, location)
            VALUES($1, $2, $3, $4)
            ON CONFLICT (username) DO NOTHING
            RETURNING *;
        `, [username, password, name, location]);
        // this method prevents string injection 
        // -- ie. the bad peoples trying to do bad things to our data
        // and possible user's of our application. 

        // I don't fully understand the mechanics of it, but I understand
        // it's purpose. 

        return user;
    } catch (error) {
        throw error;
    }
}

// UPDATE USER

async function updateUser(id, fields = {}) {
    //build the set string
    const setString = Object.keys(fields).map(
        (key, index) => `"${key}"=$${index + 1}`
    ).join(', ');

    // return early if this is called without fields
    // does fields reference to <fields> element in html?
    if (setString.length === 0) {
        return;
    }

    try {
        // destructuring the users within the rows of the table
        const { rows: [user] } = await client.query(`
        UPDATE users
        SET ${ setString}
        WHERE id=${ id}
        RETURNING *;
        `, Object.values(fields));// This line I need help with but this 
        // over all sets the corresponding new strings to be set as the new values
        // to the specificed user's(called by their id) keys in the selected table. 

        return user;
    } catch (error) {
        throw error;
    }
}

// GET ALL USERS
async function getAllUsers() {

    // Grabs the destructured rows from the client, 
    // and asks for the id & username from the users table
    try {
        const { rows } = await client.query(`
        SELECT id, username, name, location, active
        FROM users;
        `);

        return rows;
    } catch (error) {
        console.error("Oh no! No users!");
        throw error;
    }
}

// GET USER BY ID

async function getUserById(userId) {
    try {
        // Grab the object that contans the 'rows' array,
        //containing the 'user object.
        const { rows: [user] } = await client.query(`
            SELECT id, username, name, location, active 
            FROM users 
            WHERE id=${ userId}
        `);

        // if no rows/rows.length return null
        if (!user) {
            return null
        }

        // Get the users posts, then add those to the user object w/ key "posts"
        user.posts = await getPostsByUser(userId);

        return user;
    } catch (error) {
        throw error;
    }
}

// POSTS

// CREATE POSTS

async function createPost({
    authorId,
    title,
    content,
}) {
    try {

        //refer to notes of createUser
        const { rows: [post] } = await client.query(`
            INSERT INTO posts("authorId", title, content)
            VALUES($1, $2, $3)
            RETURNING *;
        `, [authorId, title, content]);

        return post;
    } catch (error) {
        throw error;
    }
}

// UPDATE POSTS

async function updatePost(id, fields = {}) {
    //build the set string
    const setString = Object.keys(fields).map(
        (key, index) => `"${key}"=$${index + 1}`
    ).join(', ');

    // return early if this is called without fields
    if (setString.length === 0) {
        return;
    }
    try {
        // destructuring the users within the rows of the table
        const { rows: [post] } = await client.query(`
          UPDATE posts
          SET ${ setString}
          WHERE id=${ id}
          RETURNING *;
          `, Object.values(fields));

        return post;
    } catch (error) {
        throw error;
    }
    // refer to updateUser for more detailed notes
}

// GET ALL POSTS

async function getAllPosts() {
    try {
        // refer to getAllUsers
        const { rows } = await client.query(`
        SELECT * 
        FROM posts;
        `);

        return rows;
    } catch (error) {
        console.error("Oh no! No posts!");
        throw error;
    }
}

// GET POSTS BY USER

async function getPostsByUser(userId) {
    try {
        // this grabs the all of the row objects(their keys and values)
        // from the posts table corresponding to the provided userId's
        const { rows } = await client.query(`
        SELECT * 
        FROM posts 
        WHERE "authorId"=${ userId};`
        );

        return rows;
    } catch (error) {
        console.log("Oh no! Could not get the User's posts!");
        throw error;
    }
}

// Exports contents, so they may be imported and used elsewhere
module.exports = {
    client,
    getAllUsers,
    createUser,
    updateUser,
    getAllPosts,
    createPost,
    updatePost,
    getPostsByUser,
    getUserById
}

