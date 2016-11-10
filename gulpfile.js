var gulp = require('gulp');

// set the default task.
gulp.task('default', ['express-app']);

// using the express to serve static files.
var gls = require('gulp-live-server');
// the simplest express static server.
//var liveServer = gls.static('.', 8900);
// using a simple javascript file for express server.
var liveServer = gls.new('test/express.js');
gulp.task('express-app', function() {

    liveServer.start();
});
