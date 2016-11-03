var bcrypt = require('bcryptjs'); //added to hash the password for encryption
var _ = require('underscore');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('user', {
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
        instanceMethods: { // these are custom methods that exist at the object instance level instead of the model level. That means user. instead of db.user.
            toPublicJSON: function() { // here we want to ensure tha that password data is not returned in the object instance
                var json = this.toJSON();
                return _.pick(json, 'id', 'email',
                    'createdAt', 'updatedAt');
            }
        }

    });
};
