const express = require('express'); // activate express in this file
const apiRouter = express.Router(); // name this new router

// Setting JsonWeBToken - creates a SECRET string of code that is encrypted;
// good for setting and protecting user data info ie. usernames and passwords
const jwt = require('jsonwebtoken');
const { getUserById } = require('../db');
const { JWT_SECRET } = process.env;

apiRouter.use(async (req, res, next) => {
    const prefix = 'Bearer '; // this needs to be with our token on the users side
    const auth = req.header('Authorization'); // grab the authorization header

    // 1. IF: The Authorization header wasn't set. This mght happen with registation
    // or login, or when the browser doesn't have a saved token. Regardless of why,
    // there is no way we can set a user if their data isn't passed to us.
    if (!auth) {
        next(); // if the token is invalid -- YOU SHALL NOT PASS
    } else if (auth.startsWith(prefix)) { // the prefix is required with token and needs to come first
        // 2. ELSE IF: It was set, and begins with 'Bearer '. If so, we'll read the token
        // and try to decrypt it. A. on Success - jwt.verify, try to read user from database
        // B. A failed jwt verify throws an error which we catch in the catch block. We read
        // the name & message on the error and pass it to next();
        const token = auth.slice(prefix.length); // slices the index of our string by its number of characters 
        // where 'Bearer ' is a total of 7 characters.

        try {
            const { id } = jwt.verify(token, JWT_SECRET);
            // A. on Success - jwt.verify
            if (id) {
                req.user = await getUserById(id);
                next();
            }
        } catch ({ name, message }) {
            // B. A failed jwt verify throws an error which we catch in the catch block. We read
            // the name & message on the error and pass it to next();
            next({ name, message });
        }
    } else {
        next({
            // 3. ELSE - A user set the header, but it wasn't formed correctly. We
            // send a name & message to next();
            name: 'AuthorizationHeaderError',
            message: `Authorization token must start with ${prefix}`
        });
    }
});

apiRouter.use((req, res, next) => {
    if (req.user) {
        console.log("User is set:", req.user);
    }
    next();
});

const usersRouter = require('./users'); // import usersRouter from its local location
apiRouter.use('/users', usersRouter); // when the apiRouter recieves a GET request to /users activate 
//the use of the usersRouter - where the functions will break down
//the request and return an appropriate response.

const postsRouter = require('./posts');
apiRouter.use('/posts', postsRouter);

const tagsRouter = require('./tags');
apiRouter.use('/tags', tagsRouter);

apiRouter.use((error, req, res, next) => {
    res.send(error);
});

apiRouter.use((req, res, next) => {
    console.log('Request object not found!');
    res.sendStatus(404);
});

module.exports = apiRouter; // un-named router export
