
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

async function getUserByUsername(username) {
    try {
        const { rows: [user] } = await client.query(`
        SELECT *
        FROM users
        WHERE username=$1
        `, [username]);

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
    tags = []
}) {
    try {

        //refer to notes of createUser
        const { rows: [post] } = await client.query(`
            INSERT INTO posts("authorId", title, content)
            VALUES($1, $2, $3)
            RETURNING *;
        `, [authorId, title, content]);

        const tagList = await createTags(tags);

        return await addTagsToPost(post.id, tagList);
    } catch (error) {
        console.error("Failed to createPost in index...");
        throw error;
    }
}

// UPDATE POSTS

async function updatePost(postId, fields = {}) {
    //read off the tags & remove that field
    const { tags } = fields;
    delete fields.tags;

    //build the set string
    const setString = Object.keys(fields).map(
        (key, index) => `"${key}"=$${index + 1}`
    ).join(', ');

    try {
        // update any fields that need to be updated
        if (setString.length > 0) {
            await client.query(`
          UPDATE posts
          SET ${ setString}
          WHERE id=${ postId}
          RETURNING *;
          `, Object.values(fields));
        }

        // return early if there's no tags to update
        if (tags === undefined) {
            return await getPostById(postId);
        }

        // make any new tags that need to be made
        const tagList = await createTags(tags);
        const tagListIdString = tagList.map(
            tag => `${tag.id}`
        ).join(', ');

        //delete any post_tags from the database which aren't in that tagList
        await client.query(`
        DELETE FROM post_tags
        WHERE "tagId"
        NOT IN (${ tagListIdString})
        AND "postId"=$1;
        `, [postId]);

        // and create post_tags as necessary
        await addTagsToPost(postId, tagList)

        return await getPostById(postId);
    } catch (error) {
        console.error("Failed to run updatePost")
        throw error;
    }
    // refer to updateUser for more detailed notes
}

// GET ALL POSTS

async function getAllPosts() {
    try {
        // refer to getAllUsers
        const { rows: postIds } = await client.query(`
        SELECT id
        FROM posts;
        `);

        const posts = await Promise.all(postIds.map(
            post => getPostById(post.id)
        ));

        return posts;
    } catch (error) {
        console.error("Oh no! No posts!");
        throw error;
    }
}

async function getPostsByTagName(tagName) {
    try {
        const { rows: postIds } = await client.query(`
        SELECT posts.id
        FROM posts
        JOIN post_tags ON posts.id=post_tags."postId"
        JOIN tags ON tags.id=post_tags."tagId"
        WHERE tags.name=$1;
        `, [tagName]);

        return await Promise.all(postIds.map(
            post => getPostById(post.id)
        ));
    } catch (error) {
        console.log("Failed to grab posts by Tag Name...");
        throw error;
    }
}

// GET POSTS BY USER

async function getPostsByUser(userId) {
    try {
        // this grabs the all of the row objects(their keys and values)
        // from the posts table corresponding to the provided userId's
        const { rows: postIds } = await client.query(`
        SELECT id
        FROM posts 
        WHERE "authorId"=${ userId};
        `);

        const posts = await Promise.all(postIds.map(
            post => getPostById(post.id)
        ));

        return posts;
    } catch (error) {
        console.log("Oh no! Could not get the User's posts!");
        throw error;
    }
}

async function getPostById(postId) {
    try {
        const { rows: [post] } = await client.query(`
        SELECT * 
        FROM posts
        WHERE id=$1;
        `, [postId]);

        const { rows: tags } = await client.query(`
        SELECT tags.*
        FROM tags
        JOIN post_tags ON tags.id=post_tags."tagId"
        WHERE post_tags."postId"=$1;
        `, [postId]);

        const { rows: [author] } = await client.query(`
        SELECT id, username, name, location
        FROM users
        WHERE id=$1;
        `, [post.authorId]);

        post.tags = tags;
        post.author = author;

        delete post.authorId;

        return post;
    } catch (error) {
        console.error(" Could not grab the post by it's id");
        throw error;
    }
}

// TAGS

// CREATE THE TAGS
async function createTags(tagList) {
    if (tagList.length === 0) {
        return;
    }

    const insertValues = tagList.map(
        (_, index) => `$${index + 1}`).join('), (');

    const selectValues = tagList.map(
        (_, index) => `$${index + 1}`).join(', ');

    try {
        // insert all, ignoring duplicates
        await client.query(`
            INSERT INTO tags(name)
            VALUES (${insertValues})
            ON CONFLICT (name) DO NOTHING;
            `, tagList);

        // grab all and return
        const { rows } = await client.query(`
            SELECT *
            FROM tags
            WHERE name
            IN (${selectValues});
        `, tagList);

        return rows;
    } catch (error) {
        console.error("Error: Tag you are not it! Tag not created.")
        throw error
    }
}

async function createPostTag(postId, tagId) {
    try {
        await client.query(`
        INSERT INTO post_tags("postId", "tagId")
        VALUES ($1, $2)
        ON CONFLICT ("postId", "tagId") DO NOTHING;
        `, [postId, tagId]);

        console.log([tagId]);
    } catch (error) {
        console.log("Failed to create post tag in index");
        throw error;
    }
}

async function addTagsToPost(postId, tagList) {
    try {

        const createPostTagPromises = tagList.map(
            tag => createPostTag(postId, tag.id)
        );

        await Promise.all(createPostTagPromises);

        return await getPostById(postId);
    } catch (error) {
        console.log("Failed to add tags to posts");
        throw error;
    }
}

async function getAllTags() {
    try {
        const { rows } = await client.query(`
        SELECT *
        FROM tags;
        `);

        return { rows };
    } catch (error) {
        console.log("Failed to grab all tags...");
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
    getUserById,
    createTags,
    addTagsToPost,
    createPostTag,
    getAllTags,
    getPostsByTagName,
    getUserByUsername
}

