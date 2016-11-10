// the very simple express server.

var express = require('express');
var serveIndex = require('serve-index');
var app = express();

// list current folder's index too.
app.use('/', serveIndex('.'));
//load static files.
app.use('/demo', express.static('demo'));
app.use('/demo', serveIndex('demo'));
app.use('/src', express.static('src', {index:false}));
app.use('/src', serveIndex('src'));
app.use('/bower_components', express.static('bower_components'));
app.use('/bower_components', serveIndex('bower_components'));
// addin the node_modules too.
app.use('/node_modules', express.static('node_modules'));
app.use('/node_modules', serveIndex('node_modules'));

// hello world simple get.
app.get('/hello', function(req, res) {
    res.send('<h1>Hello Express World</h1>');
});

// start server.
var server = app.listen(8900, function() {
});
