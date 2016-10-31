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
    res.json(todos); // a bulit in function that mirrors JSON.stringify();
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
    }); //underscorer method to locate an object in an array

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


app.listen(PORT, function() {
    console.log('Express listening on port:' + PORT + '!');
});
