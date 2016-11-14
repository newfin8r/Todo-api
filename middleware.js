module.exports = function(db) { //we are setting it to a function instead of an object so that other files can send in configuration data
    return { //in here define any middleware you might want
        requireAuhentication: function(req, res, next) { //middleware recieves this third 'next' param
            var token = req.get('Auth'); //get token from header

            db.user.findByToken(token).then(function(user) { // a custom model function we've written that returns a promise
                req.user = user; //adds user to response. This means you can access the user anywhere in the request processing to get other related objects suach as you see in the post todo functions in server.js
                next();
            }, function() {
                res.status(401).send(); //no 'next' called and stops process
            });

        }
    };
};
