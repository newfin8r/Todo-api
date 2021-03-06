var express = require('express');
var bodyParser = require('body-parser'); //this is middleware for express so must be added to express like normal middleware
var _ = require('underscore');
var db = require('./db.js');
var bcrypt = require('bcryptjs');
var middleware = require('./middleware.js')(db); //notice that because we defined this middleware as a function we can pass db into it

var app = express();
var PORT = process.env.PORT || 3000
var todos = [];
var todoNextId = 1;

app.use(bodyParser.json()); //bodyParser added as middleware to express

app.get('/', function(req, res) {
    res.send('Todo API Root');
});

//GET request /todos FOR ALL TODOS
app.get('/todos', middleware.requireAuhentication, function(req, res) { //notice that we've injected the middleware into this function by adding it as the second paramater which, in this case, requires that the user be authenticated in order to perform this function
    var queryParams = req.query //gets the query string params. All values come in as strings
    var where = {
        userId: req.user.get('id')
    };

    if (queryParams.hasOwnProperty('completed')) {
        if (queryParams.completed === 'true') {
            where.completed = true;
        } else {
            where.completed = false;
        }
    }

    if (queryParams.hasOwnProperty('q') && queryParams.q.length > 0) {
        where.description = {
            $like: '%' + queryParams.q + '%'
        };
    }

    db.todo.findAll({
        where: where
    }).then(function(todos) {
        res.json(todos);
    }, function(e) {
        res.status(500).send();
    });
});

//GET request /todo for a specific todo
app.get('/todos/:id', middleware.requireAuhentication, function(req, res) { //notice that we've injected the middleware into this function by adding it as the second paramater which, in this case, requires that the user be authenticated in order to perform this function
    var todoId = parseInt(req.params.id, 10); //params are allstring so, in this case, needs to be converted
    //db.todo.findById(todoId).then(function(todo) {
    db.todo.findOne({
        where: {
            id: todoId,
            userId: req.user.get('id')
        }
    }).then(function(todo) {
        if (!!todo) { //using !! turns 'truthy' objects into the boolean true representation while ! put it to false
            res.json(todo.toJSON());
        } else {
            res.status(404).send();
        }
    }, function(e) {
        res.status(500).send();
    });
});


//DELETE request /todo for a specific todo
app.delete('/todos/:id', middleware.requireAuhentication, function(req, res) { //notice that we've injected the middleware into this function by adding it as the second paramater which, in this case, requires that the user be authenticated in order to perform this function
    var todoId = parseInt(req.params.id, 10); //params are allstring so, in this case, needs to be converted
    db.todo.destroy({
        where: {
            id: todoId,
            userId: req.user.get('id')
        }
    }).then(function(rowsDeleted) {
        if (rowsDeleted == 0) {
            res.status(404).json({
                error: "No todo found with id:" +
                    todoId
            });
        } else {
            res.status(204).send(); //204 = everything went find but nothing to return
        }
        res.status(200).send();
    }, function() {
        res.status(500).send();
    });

    //My attempt that works:
    // db.todo.findById(todoId).then(function(todo) {
    //     db.todo.destroy({
    //         where: {
    //             id: todoId
    //         }
    //     }).then(function() {
    //         res.status(200).send();
    //     });
    // }, function() {
    //     res.status(404).json({
    //         "error": "no todo found with that id."
    //     })
    // })

});

//POST /todos/ to create new todo// requires body-parse module
app.post('/todos', middleware.requireAuhentication, function(req, res) { //notice that we've injected the middleware into this function by adding it as the second paramater which, in this case, requires that the user be authenticated in order to perform this function
    var body = _.pick(req.body, 'description', 'completed'); //make sure only desired fields are added
    db.todo.create(body).then(function(todo) {
        req.user.addTodo(todo).then(function(todo) { // the user object was added to the req by the middleware. This process creates te associateion between the todo and user
            // now that you've added a usr assocatin with the todo it must be reloaded from the db as they todo in memory doesn't have the user data
            return todo.reload();
        }).then(function(todo) { //this todo is new reloaded one from the db
            res.json(todo.toJSON());
        });
    }, function(e) {
        res.status(400).json(e);
    });

    /*Long method
    var body = _.pick(req.body, 'description', 'completed'); //make sure only desired fields are added
    if ((!_.isBoolean(body.completed)) || (!_.isString(body.description)) ||
        (body.description.trim().length === 0)) {
        return res.status(400).send(); //return error
    }
    body.description = body.description.trim();
    db.todo.create({
        description: 'Walk the dog',
        completed: false
    }).then(function(todo) {
        res.status(200).json(todo);
    }).catch(function(e) {
        res.status(400).json(e);
    });
    */
});


//PUT /todos/ to update a todo// requires body-parse module
app.put('/todos/:id', middleware.requireAuhentication, function(req, res) { //notice that we've injected the middleware into this function by adding it as the second paramater which, in this case, requires that the user be authenticated in order to perform this function
    var body = _.pick(req.body, 'description', 'completed'); //make sure only desired fields are added
    var todoId = parseInt(req.params.id, 10);

    var attributes = {};

    //body.hasOwnProperty('completed');//lets you know if an object has a specified property
    //less validation required in db version due to validation on the db side
    if (body.hasOwnProperty('completed')) {
        attributes.completed = body.completed; //has the property and is a boolean
    }
    if (body.hasOwnProperty('description')) {
        attributes.description = body.description; //has the property and is a string
    }

    //db.todo.findById(todoId).then(function(todo) {
    db.todo.findOne({
        where: {
            id: todoId,
            userId: req.user.get('id')
        }
    }).then(function(todo) {
        if (todo) {
            todo.update(attributes).then(function(todo) { //notice that this is an instance of todo method instead of a db.todo method
                res.json(todo.toJSON());
            }, function(e) { //is the failure call for the 'then' above
                res.status(400).json(e)
            });
        } else {
            res.status(404).send();
        }
    }, function() {
        res.status(500).send();
    });
});

//POST /todos/ to create new todo// requires body-parse module
app.post('/users', function(req, res) {
    var body = _.pick(req.body, 'email', 'password'); //make sure only desired fields are added
    db.user.create(body).then(function(user) {
        res.json(user.toPublicJSON()); //toPublicJSON is a custom instance methos defined in user.js
    }, function(e) {
        res.status(400).json(e);
    });
});

//POST /users/login to login users
app.post('/users/login', function(req, res) {
    var body = _.pick(req.body, 'email', 'password'); //make sure only desired fields are added
    var userInstance;

    db.user.authenticate(body).then(function(user) {
        var token = user.generateToken('authentication');
        userInstance = user;
        return db.token.create({
            token: token
        });
    }).then(function(tokenInstance) {
        res.header('Auth', tokenInstance.get('token')).json(
            userInstance.toPublicJSON());
    }).catch(function() {
        res.status(401).send();
    });
});

//Delete /users/login - to delete a login instance resulting in a logout. Obviously this will aldo require athentication
app.delete('/users/login', middleware.requireAuhentication, function(req, res) {
    req.token.destroy(function() {
        res.status(204).send();
    }).catch(function() {
        res.status(500).send();
    });
});

db.sequelize.sync({
    force: true
}).then(function() { //same idea as was done in basic-sqlite-database.js but wih the imported db object
    //once the database is connected start the server. Without the database it would be outside of this promise and just be in the file:
    //using db.sequelize.sync({force: true}).then... recreates the database
    app.listen(PORT, function() {
        console.log('Express listening on port:' + PORT +
            '!');
    });
});

/* local in memory version before db interactivity
//POST /todos/ to create new todo// requires body-parse module
app.post('/todos', function(req, res) {
    var body = _.pick(req.body, 'description', 'completed'); //make sure only desired fields are added
    if ((!_.isBoolean(body.completed)) || (!_.isString(body.description)) ||
        (body.description.trim().length === 0)) {
        return res.status(400).send(); //return error
    }
    body.description = body.description.trim();
    body.id = todoNextId;
    todoNextId++;
    todos.push(body);
    res.json(
        body);
    //console.log('description: ' + body.description);
});

//GET request /todos FOR ALL TODOS
app.get('/todos', function(req, res) {
    var queryParams = req.query //gets the query string params. All values come in as strings
    var filteredTodos = todos;

    if (queryParams.hasOwnProperty('completed') && queryParams.completed ===
        'true') { //notice that you can't check if it's a boolean because the query string params are strings
        filteredTodos = _.where(filteredTodos, {
            completed: true //underscorer method to locate an object in an array. notice that there are no quotes around the property name
        });
    } else if (queryParams.hasOwnProperty('completed') && queryParams.completed ===
        'false') { //notice that you can't check if it's a boolean because the query string params are strings
        filteredTodos = _.where(filteredTodos, {
            completed: false //underscorer method to locate an object in an array. notice that there are no quotes around the property name
        });
    }

    if (queryParams.hasOwnProperty('q') && queryParams.q.length > 0) {
        filteredTodos = _.filter(filteredTodos, function(todo) { //the filter methos allows you to create a new array from am existign one and check each item for inclusion with the callback method
            return todo.description.toLowerCase().indexOf(
                    queryParams.q.toLowerCase()) != -
                1; //if the return is true it is added to te search results
        });
    }
    res.json(filteredTodos); // a bulit in function that mirrors JSON.stringify();
});

//GET request /todo for a specific todo
app.get('/todos/:id', function(req, res) {
    //res.send('requesting:' + req.params.id);

    var todoId = parseInt(req.params.id, 10); //params are allstring so, in this case, needs to be converted
    var selectedTodo;

    // replced with underscore version below
    //todos.forEach(function(todo) {
    //    if (todo.id === todoId) {
    //        selectedTodo = todo;
    //    }
    //});

    selectedTodo = _.findWhere(todos, {
        id: todoId
    });

    if (selectedTodo) {
        res.json(selectedTodo);
    } else {
        res.status(404).send(); //send a 404 if there is no match
    }

});

app.delete('/todos/:id', function(req, res) {
    var todoId = parseInt(req.params.id, 10); //params are allstring so, in this case, needs to be converted
    var selectedTodo;

    selectedTodo = _.findWhere(todos, {
        id: todoId
    }); //underscorer method to locate an object in an array. notice that there are no quotes around the property name

    if (selectedTodo) {
        todos = _.without(todos, selectedTodo); //underscore method to return a copy of an array with the passed in object(s) removed
        res.json(selectedTodo);
    } else {
        res.status(404).json({
            "error": "no todo found with that id."
        }); //send a 404 if there is no match
    }

});

//PUT /todos/ to update a todo// requires body-parse module
app.put('/todos/:id', function(req, res) {
    var body = _.pick(req.body, 'description', 'completed'); //make sure only desired fields are added
    var todoId = parseInt(req.params.id, 10);
    var selectedTodo;
    var validAttributes = {};

    selectedTodo = _.findWhere(todos, {
        id: todoId
    });
    if (!selectedTodo) {
        return res.status(404).json({ // the use of return makes sure that nothign after it in the function executes
            "error": "no todo found with that id."
        }); //send a 404 if there is no match
    }

    //body.hasOwnProperty('completed');//lets you know if an object has a specified property
    if (body.hasOwnProperty('completed') && _.isBoolean(body.completed)) {
        validAttributes.completed = body.completed; //has the property and is a boolean
    } else if (body.hasOwnProperty('completed')) { //has the property but is not a boolean
        return res.status(400).json({
            "error": "completed property must be a boolean"
        });
    } else {
        //attribute not provided. request remains valid
    }

    if (body.hasOwnProperty('description') && _.isString(body.description) &&
        body.description.trim().length > 0) {
        validAttributes.description = body.description; //has the property and is a string
    } else if (body.hasOwnProperty('isString')) { //has the property but is not a string
        return res.status(400).json({
            "error": "description property must be a non-zero length string"
        });
    } else {
        //attribute not provided. request remains valid
    }
    console.log('validAttributes:' + JSON.stringify(validAttributes));
    _.extend(selectedTodo, validAttributes); //this method add any new fields in the objects and updates any existing fields with those on the array
    //***note: you don't have to explicitly update the todos array because javascript by default passes objects by reference.
    res.json(selectedTodo);
});
*/
