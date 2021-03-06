var Sequelize = require('Sequelize');
var sequelize = new Sequelize(undefined, undefined, undefined, {
    'dialect': 'sqlite',
    'storage': __dirname + 'basic-sqlite-database.sqlite' //__dirname == current directory
}); //creates a local instance of Sequelize

var Todo = sequelize.define('todo', { //example model
    description: {
        type: Sequelize.STRING,
        allowNull: false, //allowNull falls at the root of the object the rest live inside "validate"
        validate: { //check docs.sequelizejs.com documention for the numerous validation options
            len: [1, 250] //set minimum and maximum length
        }
    },
    completed: {
        type: Sequelize.BOOLEAN,
        allowNull: false, //allowNull falls at the root of the object the rest live inside "validate"
        defaultValue: false
    }
})

var User = sequelize.define('user', {
    email: {
        type: Sequelize.STRING
    }
    //could also be written as email:Sequelize.STRING due to it being so simple
});

//the two lines below creates a relationship between users and todos and will cause foreign keys to be generated tin the database
Todo.belongsTo(User);
User.hasMany(Todo);

sequelize.sync({
    //force: true
    //force: true//force:true mkes it frop te existing tables and replace
}).then(function() { //calling sync takes your objects and creates tables to mirrors the defined models.
    console.log('Everything Synced');
    User.findById(1).then(function(user) { //notice User not user fr the findById call
        user.getTodos({
            where: {
                completed: false //find only pending items for a sepcific user
            }
        }).then(function(todos) {
            todos.forEach(function(todo) {
                console.log(todo.toJSON());
            })
        });
    });
    // User.create({
    //     email: 'bdoug@rogers.com'
    // }).then(function() {
    //     return Todo.create({ //using the return allows the chaining of promises
    //         description: 'clean yard'
    //     });
    // }).then(function(todo) {
    //     User.findById(1).then(function(user) {
    //         user.addTodo(todo); //the addTodo function is automatically buld by sequelize once you've created the association between users and todos
    //     })
    // });

});



// DEMO process and data:
// sequelize.sync({
//     force: true
//     //force: true//force:true mkes it frop te existing tables and replace
// }).then(function() { //calling sync takes your objects and creates tables to mirrors the defined models.
//     console.log('everything is synced');
//
//     Todo.create({ //normally you wouldn't have this many .then() clauses chained together
//         description: 'Walk the dog',
//         completed: false
//     }).then(function(todo) { //returns a promise
//         return Todo.create({
//             description: 'Clean kitchen'
//         });
//     }).then(function() {
//         //return Todo.findById(1)
//         return Todo.findAll({ //where is an object that defines the query conditions
//             where: {
//                 //completed: false//example of explicitly setting completed
//                 description: { //or assing complted to another opbject
//                     $like: '%office%' //searches for a word inside object. it ignores case
//                 }
//             }
//         })
//     }).then(function(todos) {
//         if (todos) {
//             todos.forEach(function(todo) {
//                 console.log(todo.toJSON());
//             });
//
//         } else {
//             console.log('todos not found');
//         }
//         //below for when returning a single todo in fundById(1)
//         //    }).then(function(todo) {
//         //        if (todo) {
//         //            console.log(todo.toJSON());/
//         //        } else {
//         //            console.log('todo not found');
//         //        }
//     }).catch(function(e) {
//         console.log(e);
//     });
// });
