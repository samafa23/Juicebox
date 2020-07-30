const express = require('express'); // activate express in this file
const apiRouter = express.Router(); // name this new router

const usersRouter = require('./users'); // import usersRouter from its local location
apiRouter.use('/users', usersRouter); // when the apiRouter recieves a GET request to /users activate 
//the use of the usersRouter - where the functions will break down
//the request and return an appropriate response.

const postsRouter = require('./posts');
apiRouter.use('/posts', postsRouter);

const tagsRouter = require('./tags');
apiRouter.use('/tags', tagsRouter);

module.exports = apiRouter; // un-named router export
