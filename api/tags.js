const express = require('express');
const tagsRouter = express.Router();
const { getAllTags, getPostsByTagName } = require('../db');

tagsRouter.use((req, res, next) => {
    console.log("A request is being made to /tags");

    next();
});

tagsRouter.get('/', async (req, res) => {
    const tags = await getAllTags();

    res.send({
        tags
    });
});

tagsRouter.get('/:tagName/posts', async (req, res, next) => {
    //read the tagname from params
    const { tagName } = req.params;

    try {
        const data = await getPostsByTagName(tagName);
        data.filter(post => {
            return !post.active || (req.user && post.author.id === !req.user.id)
        });
        if (data) {
            res.send({ posts: data });
        } else {
            next({
                name: "NoPostsWithTag",
                message: "No posts found with specified tag!"
            });
        }

    } catch ({ name, message }) {
        next({ name, message });
    }
});

module.exports = tagsRouter;


