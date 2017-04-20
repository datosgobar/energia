const gulp          = require('gulp');
const sass          = require('gulp-sass');
const clean         = require('gulp-clean');
const babel         = require('gulp-babel');
const uglify        = require('gulp-uglify');
const rename        = require('gulp-rename');
const plumber       = require('gulp-plumber');
const htmlmin       = require('gulp-htmlmin');
const cssnano       = require('gulp-cssnano');
const sequence      = require('gulp-sequence');
const sourcemaps    = require('gulp-sourcemaps');
const autoprefixer  = require('gulp-autoprefixer');
const browserSync   = require('browser-sync').create();

//  Static Server
    gulp.task('start_server', () => {
        return browserSync.init({
            server: { baseDir: '' }
        });
    });

//  Delete all files
    gulp.task('delete_compiled_files', () => {
      return gulp.src([
        './*.html',
        './public/css/*.*',
        './public/js/*.*',
        './public/src/scss/plugins/*.*',
        './public/src/babel/plugins/*.*',
      ]).pipe(clean({ force: true }));
    });

//  Mover archivos de node_modules
    gulp.task('node_reply_styles', () => {
      return gulp.src([
        './node_modules/bootstrap/dist/css/bootstrap.css',
        './node_modules/argob-poncho/dist/css/roboto-fontface.css',
        './node_modules/argob-poncho/dist/css/poncho.css',
      ])
      .pipe(gulp.dest('./public/src/scss/plugins/'))
      .on('error', function(err) {
        console.error('Error in compress node_reply_styles', err.toString());
      });
    });
    gulp.task('node_reply_fonts', () => {
      return gulp.src([
        './node_modules/argob-poncho/dist/fonts/*',
      ]).pipe(gulp.dest('./public/fonts/')).on('error', function(err) {
        console.error('Error in compress node_reply_fonts', err.toString());
      });
    });
    gulp.task('node_reply_javascript', () => {
      return gulp.src([
        './node_modules/jquery/dist/jquery.js',
        './node_modules/bootstrap/dist/js/bootstrap.js',
        './node_modules/d3/build/d3.js',
        './node_modules/d3-drag/build/d3-drag.js',
      ]).pipe(gulp.dest('./public/src/babel/plugins/')).on('error', function(err) {
        console.error('Error in compress node_reply_javascript', err.toString());
      });
    });

//  Vistas
    gulp.task('view_dev', () => {
      // Se toman todos los archivos de la carpeta public/src/view
      return gulp.src('./public/src/view/*.html')
          .pipe(plumber())
          .pipe(gulp.dest('./'))
          .on('error', function(err) {
            console.error('Error in compress view', err.toString());
          })
          .pipe(browserSync.stream());
    });
    gulp.task('view_prod', () => {
      // Se toman todos los archivos de la carpeta public/src/view
      return gulp.src('./public/src/view/*.html')
          .pipe(plumber())
          .pipe(htmlmin({ collapseWhitespace: true }))
          .pipe(gulp.dest('./'))
          .on('error', function(err) {
            console.error('Error in compress view', err.toString());
          });
    });

//  SASS
    gulp.task('sass_dev', () => {
      // Se toman todos los archivos de la carpeta public/src/scss
      return gulp.src(['./public/src/scss/*.css', './public/src/scss/*.scss'])
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(autoprefixer({
          browsers: [ 'last 8 Chrome versions', 'last 8 Firefox versions', 'last 8 Explorer versions', 'last 8 Edge versions', 'last 8 iOS versions', 'last 8 Opera versions', 'last 8 Safari versions', 'last 8 ExplorerMobile versions', 'last 8 Android versions', 'last 8 BlackBerry versions', 'last 8 ChromeAndroid versions', 'last 8 FirefoxAndroid versions', 'last 8 OperaMobile versions', 'last 8 OperaMini versions', 'last 8 Samsung versions', 'last 8 UCAndroid versions' ],
          cascade: true
        }))
        .pipe(sourcemaps.write(''))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('./public/css/'))
        .on('error', function(err) {
          console.error('Error in compress sass_dev', err.toString());
        })
        .pipe(browserSync.stream());
    });
    gulp.task('sass_plugins_dev', () => {
      // Se toman todos los archivos de la carpeta public/src/scss
      return gulp.src(['./public/src/scss/plugins/*.css', './public/src/scss/plugins/*.scss'])
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(sourcemaps.write(''))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('./public/css/'))
        .on('error', function(err) {
          console.error('Error in compress sass_plugins_dev', err.toString());
        })
        .pipe(browserSync.stream());
    });
    gulp.task('sass_prod', () => {
      // Se toman todos los archivos de la carpeta public/src/scss
      return gulp.src(['./public/src/scss/*.css', './public/src/scss/*.scss'])
        .pipe(plumber())
        .pipe(sass())
        .pipe(autoprefixer({
          browsers: [ 'last 8 Chrome versions', 'last 8 Firefox versions', 'last 8 Explorer versions', 'last 8 Edge versions', 'last 8 iOS versions', 'last 8 Opera versions', 'last 8 Safari versions', 'last 8 ExplorerMobile versions', 'last 8 Android versions', 'last 8 BlackBerry versions', 'last 8 ChromeAndroid versions', 'last 8 FirefoxAndroid versions', 'last 8 OperaMobile versions', 'last 8 OperaMini versions', 'last 8 Samsung versions', 'last 8 UCAndroid versions' ],
          cascade: false
        }))
        .pipe(cssnano())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('./public/css/'))
        .on('error', function(err) {
          console.error('Error in compress sass_prod', err.toString());
        });
    });
    gulp.task('sass_plugins_prod', () => {
      // Se toman todos los archivos de la carpeta public/src/scss
      return gulp.src(['./public/src/scss/plugins/*.css', './public/src/scss/plugins/*.scss'])
        .pipe(plumber())
        .pipe(sass())
        .pipe(cssnano())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('./public/css/'))
        .on('error', function(err) {
          console.error('Error in compress sass_plugins_prod', err.toString());
        });
    });

//  ECMAS 6
    gulp.task('babel_dev', () => {
      // Se toman todos los archivos de la carpeta public/src/babel
      return gulp.src(['./public/src/babel/*.js'])
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(babel({ presets: ['es2015', 'es2016', 'es2017'] }))
        .pipe(sourcemaps.write(''))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('./public/js/'))
        .on('error', function(err) {
          console.error('Error in compress babel_dev', err.toString());
        })
        .pipe(browserSync.stream());
    });
    gulp.task('babel_plugins_dev', () => {
      // Se toman todos los archivos de la carpeta public/src/babel
      return gulp.src(['./public/src/babel/plugins/*.js'])
        .pipe(plumber())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('./public/js/'))
        .on('error', function(err) {
          console.error('Error in compress babel_plugins_dev', err.toString());
        })
        .pipe(browserSync.stream());
    });
    gulp.task('babel_prod', () => {
      // Se toman todos los archivos de la carpeta public/src/scss
      return gulp.src(['./public/src/babel/*.js'])
        .pipe(plumber())
        .pipe(babel({ presets: ['es2015', 'es2016', 'es2017'] }))
        .pipe(uglify())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('./public/js/'))
        .on('error', function(err) {
          console.error('Error in compress babel_prod', err.toString());
        });
    });
    gulp.task('babel_plugins_prod', () => {
      // Se toman todos los archivos de la carpeta public/src/scss
      return gulp.src(['./public/src/babel/plugins/*.js'])
        .pipe(plumber())
        .pipe(uglify())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('./public/js/'))
        .on('error', function(err) {
          console.error('Error in compress babel_plugins_prod', err.toString());
        });
    });

//  Watch
    gulp.task('watch_babel', () => {
      return gulp.watch('./public/src/babel/*.js',   ['babel_dev']).on('error', function(err) {
        console.error('Error in compress watch_babel', err.toString());
      });
    });
    gulp.task('watch_scss', () => {
      return gulp.watch('./public/src/scss/*.scss',  ['sass_dev']).on('error', function(err) {
        console.error('Error in compress watch_sass', err.toString());
      });
    });
    gulp.task('watch_html', () => {
      return gulp.watch('./public/src/view/*.html',  ['view_dev']).on('error', function(err) {
        console.error('Error in compress watch_view', err.toString());
      });
    });

//  Desarrollo
    gulp.task('dev', sequence(
      'delete_compiled_files',
      ['node_reply_styles', 'node_reply_fonts', 'node_reply_javascript'],
      'view_dev',
      ['sass_dev', 'sass_plugins_dev'],
      ['babel_dev', 'babel_plugins_dev'],
      ['watch_html', 'watch_scss', 'watch_babel'],
      'start_server'
    ));

//  Production
gulp.task('prod', sequence(
  'delete_compiled_files',
  ['node_reply_styles', 'node_reply_fonts', 'node_reply_javascript'],
  'view_prod',
  ['sass_prod', 'sass_plugins_prod'],
  ['babel_prod', 'babel_plugins_prod'],
  'start_server'
));
