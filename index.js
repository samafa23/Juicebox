
require('dotenv').config();

const port = process.env.PORT || 3000; // port variable  - updated so that it defaults to 3000 if not a heroku provided port!
const express = require('express'); // import express package and sub-packages
const server = express(); //activate express && name it server
const apiRouter = require('./api'); // the router itself is NOT a node package, 
// we have to require it from the locally stored file.

const bodyParser = require('body-parser'); // node package! no install needed
server.use(bodyParser.json()); // reads incoming JSON from requests
// requests header HAS to be Content-Type: application/json.
const morgan = require('morgan');
server.use(morgan('dev')); // logs out incoming requests
// looks like GET /api/users 19.825 ms - - 

server.use((req, res, next) => { // GET request
    console.log("<____Body Logger START____>");
    console.log(req.body); // Console log request.body
    console.log("<____Body Logger END____>");

    next(); // move onto to next middleware function that correlates
});

server.use('/api', apiRouter); // All requests concerning our api will 
// use this router. ie. users, posts and tags. 
// the apiRouter is our central hub access point. It determines which table
// in our database the request wants to access, and then sends it to the 
// correlating router, where it will be broken down to the specificed requested 
// data and then send a response back. Going through multiple GET, POST, PATCH func's 
// along the way. 

const { client } = require('./db'); // import our client from our database folder
client.connect(); // Connect it up!

server.listen(port, "localhost", () => { // listen at Port 3000 and return our server
    console.log('The server is up on Port:', PORT);
});
