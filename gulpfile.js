const gulp = require('gulp');
const install = require('gulp-install');
const jshint = require('gulp-jshint');
const sequence = require('run-sequence');
const mkdirp = require('mkdirp');
const browserify = require('gulp-browserify');

var websocketVideostreamDist = './dist/websocket-videostream';

gulp.task('install', function() {
  return gulp.src('./package.json')
    .pipe(install());
});

gulp.task('generate-client', function() {
  mkdirp('www/js/dist');
  return gulp.src('client/video-client.js')
    .pipe(browserify())
    .pipe(gulp.dest('www/js/dist'), {overwrite: true});
});

gulp.task('js-lint', function() {
    return gulp.src([
        '**/*.js',
        'client/**/*.js',
        'server/**/*.js',
        'www/**/*.js',
    ])
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('default', function(callback) {
    sequence(
        'js-lint', 'generate-client',
        callback
    );
});

