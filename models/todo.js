module.exports = function(sequelize, DataTypes) { //the first param is teh sequelize instance. the second is the datatypes for defining the model
    return sequelize.define('todo', { //example model
        description: {
            type: DataTypes.STRING, //notice the use of DataTypes instead of Sequelize in this model file vs when it was done inline in the basic-sqlite-database.js
            allowNull: false, //allowNull falls at the root of the object the rest live inside "validate"
            validate: { //check docs.sequelizejs.com documention for the numerous validation options
                len: [1, 250] //set minimum and maximum length
            }
        },
        completed: {
            type: DataTypes.BOOLEAN,
            allowNull: false, //allowNull falls at the root of the object the rest live inside "validate"
            defaultValue: false
        }
    })

}
