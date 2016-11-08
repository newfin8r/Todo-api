var bcrypt = require('bcryptjs'); //added to hash the password for encryption
var _ = require('underscore');
var cryptojs = require('crypto-js');
var jwt = require('jsonwebtoken');

module.exports = function(sequelize, DataTypes) {
    var user = sequelize.define('user', { //unstead of immediatly returning the sequelize.define we've created a variable user and retunred it at the bottom so that we can reference the user variable in the class emthods defined below
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true, //ensures this value is unique for all other users BUT different case makes it a different value so you must account for this
            validate: {
                isEmail: true //built in funcitonality to verify format
            }
        },
        salt: { //a random set of chartacters to pasword before it's hashed to ensure that if different users have the same password it won't come back with the same hash
            type: DataTypes.STRING
        },
        password_hash: {
            type: DataTypes.STRING
        },
        password: {
            type: DataTypes.VIRTUAL, //VIRTUAL is a custom datatype where you can override the 'set' function which sets it's value BUT it is NOT stored in the database
            allowNull: false,
            validate: {
                len: [7, 100] //built in funcitonality to verify length
            },
            set: function(value) { // value is the plain text password provided
                var salt = bcrypt.genSaltSync(10); //this generates a random string of 10 characters
                var hashedPassword = bcrypt.hashSync(value,
                    salt); //takes the plain text va;ue and the salt to generate a hash value
                //now add to the password and salt hasfields above:
                this.setDataValue('password', value); //due to being virtual it won't be stored in the database but is derived from the databse fields being set
                this.setDataValue('salt', salt); //is saved to database
                this.setDataValue('password_hash',
                    hashedPassword); //is saved to database
            }
        }

    }, { //Notice that hooks exists isdie an object wrapper just like where
        hooks: { //hooks are like filters in that they allow you to intercept processes and inject code. Here we want to set the case of te email address to ensure uniqueness
            beforeValidate: function(user, options) { //sequelize provides and object instance to the function call which, in this case, we call user as well as a set of options. The hook we've chosen here is beforeValidation
                //convert the email to lower case but just for validation
                if (typeof(user.email) === 'string') { // if you want o use underscore you have ti require it above
                    user.email = user.email.toLowerCase();
                }
            }
        },
        classMethods: { //These class methods work at the user class level(db.user) and do no require a specific instance.
            authenticate: function(body) { //our authticate function should return a promise as we've defined it that way in server.js
                return new Promise(function(resolve, reject) {
                    if (typeof(body.email) !== 'string' ||
                        typeof(body.password) !==
                        'string') {
                        return reject();
                    }
                    user.findOne({
                        where: {
                            email: body.email.toLowerCase()
                        }
                    }).then(function(user) { //just because it retured sucessfullly doesn't mean it found a macthing record
                            if (!user || !bcrypt.compareSync(
                                    body.password,
                                    user.get(
                                        'password_hash'
                                    ))) {
                                return reject();
                            }
                            resolve(user);
                        },
                        function(e) {
                            reject();
                        });
                });
            },
            findByToken: function(token) {
                return new Promise(function(resolve, reject) {
                    try {
                        var decodedJWT = jwt.verify(
                            token, 'qwerty');
                        var bytes = cryptojs.AES.decrypt(
                            decodedJWT.token,
                            'abc123!@#'); //looking at generateToken below you can see how the token property was added to the token and that's why you retrieve it this way
                        var tokenData = JSON.parse(
                            bytes.toString(cryptojs
                                .enc.Utf8)); //this will get two pieces: id and type
                        user.findById(tokenData.id).then(
                            function(user) { //we have access to the user variable because we defined it near the top at line 7
                                if (user) {
                                    resolve(user);
                                } else {
                                    reject();
                                }
                            },
                            function(e) {
                                reject();
                            });
                    } catch (e) {
                        reject();
                    }
                });
            }
        },
        instanceMethods: { // these are custom methods that exist at the object instance level instead of the model level. That means user. instead of db.user. MUST have an instantiated model in order to use these
            toPublicJSON: function() { // here we want to ensure tha that password data is not returned in the object instance
                var json = this.toJSON();
                return _.pick(json, 'id', 'email',
                    'createdAt', 'updatedAt');
            },
            generateToken: function(type) { //this creates a toekn containing user information
                if (!_.isString(type)) {
                    return undefined;
                }

                try {
                    var stringData = JSON.stringify({ //takes the user id and type to create a string
                        id: this.get('id'),
                        type: type
                    });
                    var encryptedData = cryptojs.AES.encrypt(
                        stringData, 'abc123!@#').toString(); //takes user data and password to created an encrypted string
                    var token = jwt.sign({
                        token: encryptedData
                    }, 'qwerty'); //first argument is the data to tokenize and the second is the password
                    return token;
                } catch (e) {
                    console.error(e);
                    return undefined;
                }
            }
        }

    });

    return user;
};
