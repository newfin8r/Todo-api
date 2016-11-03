var Sequelize = require('Sequelize');
var env = process.env.NODE_ENV || 'development' //sets the env variable to process.env.NODE_ENV if availabale(it comes from heroku) and if not to 'development'
var sequelize;
if (env === 'production') { //connect to heroku database
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        'dialect': 'postgres'
    });
} else { //connect ot local db
    sequelize = new Sequelize(undefined, undefined, undefined, {
        'dialect': 'sqlite',
        'storage': __dirname + '/data/dev-todo-api.sqlite' //__dirname == current directory
    }); //creates a local instance of Sequelize
}


var db = {};

//now load sequlize models:
db.todo = sequelize.import(__dirname + '/models/todo.js') //lets you load in models from separate files. The file format is very specifc as you can see in the sample todo.js
db.user = sequelize.import(__dirname + '/models/user.js') //lets you load in user.js model.
db.sequelize = sequelize; //add references to object created above
db.Sequelize = Sequelize; //add references to object created above

module.exports = db; //you can on;y export one thing so by exporting an object you can embed mulitple things within it.
