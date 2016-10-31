var express = require('express');
var bodyParser = require('body-parser'); //this is middleware for express so must be added to express like normal middleware
var _ = require('underscore');
var app = express();
var PORT = process.env.PORT || 3000
var todos = [];
var todoNextId = 1;

app.use(bodyParser.json()); //bodyParser added as middleware to express

/*
var todos = [{
    id: 1,
    description: 'Meet mom for lunch',
    completed: false
}, {
    id: 2,
    description: 'Go to market',
    completed: false
}, {
    id: 3,
    description: 'Pick up kids',
    completed: true
}];
*/

app.get('/', function(req, res) {
    res.send('Todo API Root');
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
    res.json(filteredTodos); // a bulit in function that mirrors JSON.stringify();
});

//GET request /todo for a specific todo
app.get('/todo/:id', function(req, res) {
    //res.send('requesting:' + req.params.id);

    var todoId = parseInt(req.params.id, 10); //params are allstring so, in this case, needs to be converted
    var selectedTodo;

    /* replced with underscore version below
    todos.forEach(function(todo) {
        if (todo.id === todoId) {
            selectedTodo = todo;
        }
    });
    */
    selectedTodo = _.findWhere(todos, {
        id: todoId
    });

    if (selectedTodo) {
        res.json(selectedTodo);
    } else {
        res.status(404).send(); //send a 404 if there is no match
    }

});


//DELETE request /todo for a specific todo
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

app.listen(PORT, function() {
    console.log('Express listening on port:' + PORT + '!');
});
