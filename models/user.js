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
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [7, 100] //built in funcitonality to verify length
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
        }
    });
};
