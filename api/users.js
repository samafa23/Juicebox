const express = require('express'); // Has to be imported into each new file it is used in.
const usersRouter = express.Router(); // Call in the Router package from express && name itu sersRouter
const { getAllUsers, createUser } = require('../db'); // import getAllUsers func from database folder avail. exports
const { getUserByUsername } = require('../db');
const jwt = require('jsonwebtoken');

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

usersRouter.post('/login', async (req, res, next) => {
    const { username, password } = req.body;

    if (!username || !password) {
        next({
            name: "MissingCredentialsError",
            message: "Please supply both a username and password"
        });
    }

    try {
        const user = await getUserByUsername(username);
        if (user && user.password == password) {
            const id = user.id;
            const theUser = user.username;
            const token = jwt.sign({ id, theUser }, process.env.JWT_SECRET);
            res.send({ message: "You're logged in!", token });
        } else {
            next({
                name: 'IncorrectCredtialsError',
                message: 'Username or password is incorrect'
            });
        }
    } catch (error) {
        console.log(error);
        next(error);
    }
});

usersRouter.post('/register', async (req, res, next) => {
    const { username, password, name, location } = req.body;

    try {
        const _user = await getUserByUsername(username);

        if (_user) {
            next({
                name: 'UserExistsError',
                message: 'A user by that username already exists!'
            });
        }

        const user = await createUser({
            username,
            password,
            name,
            location,
        });

        // so I realized that I didn't type 'Not Null' by location
        // in my create users table. So I don't get that error for location
        // tested for name and it worked. 
        const token = jwt.sign({
            id: user.id,
            username
        }, process.env.JWT_SECRET, {
            expiresIn: '1w'
        });

        res.send({
            message: "Thank You for signing up",
            token
        });
    } catch ({ name, message }) {
        next({ name, message })
    }

});

module.exports = usersRouter; // un-named router export.          