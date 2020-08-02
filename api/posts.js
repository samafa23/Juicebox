const express = require('express');
const postsRouter = express.Router();
const {
    getAllPosts,
    createPost,
    updatePost,
    getPostById
} = require('../db');
const { requireUser } = require('./utils');


postsRouter.use((req, res, next) => {
    console.log("A request is being made to /posts!");

    next();
});

postsRouter.get('/', async (req, res) => {
    try {
        const allPosts = await getAllPosts();

        // keep a post if it is either active, or if it belongs to
        // the current user
        const posts = allPosts.filter(post => {
            // post is active - doesnt matter who owns it
            if (post.active) {
                return true;
            }

            // post is not active, but it belongs to current user
            if (req.user && post.author.id === req.user.id) {
                return true;
            }

            // none of the above are true
            return false;
        });

        res.send({
            posts
        });
    } catch ({ name, message }) {
        next({ name, message });
    }
});
postsRouter.patch('/:postId', requireUser, async (req, res, next) => {
    const { postId } = req.params;
    const { title, content, tags } = req.body;

    const updateFields = {};

    if (tags && tags.length > 0) {
        updateFields.tags = tags.trim().split(/\s+/);
    }

    if (title) {
        updateFields.title = title;
    }

    if (content) {
        updateFields.content = content;
    }

    try {
        const originalPost = await getPostById(postId);

        if (originalPost.author.id === req.user.id) {
            const updatedPost = await updatePost(postId, updateFields);
            res.send({ post: updatedPost });
        } else {
            next({
                name: 'UnauthorizedUserError',
                message: 'You cannot update a post that is not yours!'
            });
        }
    } catch ({ name, message }) {
        next({ name, message });
    }
});

postsRouter.post('/', requireUser, async (req, res, next) => {
    const { title, content, tags = "" } = req.body;

    const tagArr = tags.trim().split(/\s+/);
    const postData = {};

    // only send tags if there are some to send
    if (tagArr.length) {
        postData.tags = tagArr;
    }

    try {
        const { id } = req.user; // id from reg.user
        postData.authorId = id; //add id, title and content to postData
        postData.title = title;
        postData.content = content;

        const post = await createPost(postData);

        if (post) {
            res.send({ post });
        } else {
            next({
                name: "CreatePostFailed",
                message: "An error occured while creating the post!"
            });
        }
    } catch ({ name, message }) {
        next({ name, message });
    }
});

postsRouter.delete('/:postId', requireUser, async (req, res, next) => {
    try {
        const post = await getPostById(req.params.postId);

        if (post && post.author.id === req.user.id) {
            const updatedPost = await updatePost(post.id, { active: false });

            res.send({ post: updatedPost });
        } else {
            next(post ? {
                name: "UnauthorizedUserError",
                message: "You cannot delete a post which is not yours!"
            } : {
                    name: "PostNotFoundError",
                    message: "This post does not exist..."
                });
        }
    } catch ({ name, message }) {
        next({ name, message });
    }
});

module.exports = postsRouter;