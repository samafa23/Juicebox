const express = require('express'); // Has to be imported into each new file it is used in.
const usersRouter = express.Router(); // Call in the Router package from express && name itu sersRouter
const { getAllUsers } = require('../db'); // import getAllUsers func from database folder avail. exports

usersRouter.use((req, res, next) => { // GET request to /users
    console.log("A request is being made to /users");

    // res.send({ message: ' hello from /users!' }); // response to the request! Func finished.
    next(); // /users is listening and ready to respond to your requests! 
});

usersRouter.get('/', async (req, res) => { // GET request -- something special about the /
    const users = await getAllUsers(); // Grab the users table data!

    res.send({
        users // return an array of users!
    });
});

module.exports = usersRouter; // un-named router export. 