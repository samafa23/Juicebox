function requireUser(req, res, next) {
    if (!req.user) { //if no user on the request -- Do not complete
        next({
            name: "MissingUserError",
            message: "You must be logged in to perform this action"
        });
    }

    next();
}

module.exports = {
    requireUser
}