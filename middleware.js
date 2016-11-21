var cryptojs = require('crypto-js');

module.exports = function(db) { //we are setting it to a function instead of an object so that other files can send in configuration data
    return { //in here define any middleware you might want
        requireAuhentication: function(req, res, next) { //middleware recieves this third 'next' param
            var token = req.get('Auth') || ''; //get token from header. If no Auth value then uses an empty string

            db.token.findOne({ //find a toek in the database where the hash matches the Auth header value
                where: {
                    tokenHash: cryptojs.MD5(token).toString()
                }
            }).then(function(tokenInstance) {
                if (!tokenInstance) {
                    throw new Error();
                }

                req.token = tokenInstance; //found token is stored in the request object so that during logout it can be found and deleted from the database
                return db.user.findByToken(token); //the chain is kept alive by returnnig the found user for the token
            }).then(function(user) {
                req.user = user; //adds user to response. This means you can access the user anywhere in the request processing to get other related objects suach as you see in the post todo functions in server.js
                next();
            }).catch(function() { //notice that the catch has no try but is thrown above
                res.status(401).send();
            });
        }
    };
};
