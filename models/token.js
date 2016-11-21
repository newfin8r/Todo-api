var cryptojs = require('crypto-js');

module.exports = function(sequelize, DataTypes) { //instance and DataTypes params
    return sequelize.define('token', {
        token: {
            type: DataTypes.VIRTUAL,
            allowNull: false,
            validate: {
                len: [1]
            },
            set: function(value) {
                var hash = cryptojs.MD5(value).toString(); //MD5 is just an alternate encry[tion algorythm]
                this.setDataValue('token', value); //sets the value for the token property
                this.setDataValue('tokenHash', hash); //sets the value for the tokenHash property
            }

        },
        tokenHash: DataTypes.STRING //defines the tokenHash property which is set above
    });
};
