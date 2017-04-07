const gulp          = require('gulp');
const sass          = require('gulp-sass');
const clean         = require('gulp-clean');
const babel         = require('gulp-babel');
const concat        = require('gulp-concat');
const rename        = require('gulp-rename');
const plumber       = require('gulp-plumber');
const htmlmin       = require('gulp-htmlmin');
const cssnano       = require('gulp-cssnano');
const sourcemaps    = require('gulp-sourcemaps');
const autoprefixer  = require('gulp-autoprefixer');
const browserSync   = require('browser-sync').create();

//  Static Server
    gulp.task('server', () => {
        browserSync.init({
            server: { baseDir: './' }
        });
    });

//  VISTAS
    gulp.task('view:dev', () => {
      // Se toman todos los archivos de la carpeta public/view
      gulp.src('./public/src/view/*.html')
          .pipe(plumber())
          .pipe(htmlmin({ collapseWhitespace: true }))
          .pipe(gulp.dest('./'))
          .pipe(browserSync.stream());
    });
    gulp.task('view:prod', () => {
      // Se borran todos los archivos de la carpeta raiz
      gulp.src('./*.html').pipe(clean({ force: true }));

      // Se toman todos los archivos de la carpeta public/src/scss
      // Se toman todos los archivos de la carpeta public/view
      gulp.src('./public/src/view/*.html')
          .pipe(plumber())
          .pipe(htmlmin({ collapseWhitespace: true }))
          .pipe(gulp.dest('./'))
          .pipe(browserSync.stream());
    });

//  SASS
    gulp.task('sass:dev', () => {
      // Se toman todos los archivos de la carpeta public/src/scss
      gulp.src(['./public/src/scss/*.scss', './public/src/scss/*.css'])
          .pipe(plumber())
          .pipe(sourcemaps.init())
          .pipe(sass())
          .pipe(autoprefixer({
            browsers: [ 'last 8 Chrome versions', 'last 8 Firefox versions', 'last 8 Explorer versions', 'last 8 Edge versions', 'last 8 iOS versions', 'last 8 Opera versions', 'last 8 Safari versions', 'last 8 ExplorerMobile versions', 'last 8 Android versions', 'last 8 BlackBerry versions', 'last 8 ChromeAndroid versions', 'last 8 FirefoxAndroid versions', 'last 8 OperaMobile versions', 'last 8 OperaMini versions', 'last 8 Samsung versions', 'last 8 UCAndroid versions' ],
            cascade: false
          }))
          .pipe(sourcemaps.write())
          .pipe(rename({ suffix: '.min' }))
          .pipe(gulp.dest('./public/css/'))
          .pipe(browserSync.stream());
    });
    gulp.task('sass:prod', () => {
      // Se borran todos los archivos de la carpeta public/css
      gulp.src('./public/css/*.css').pipe(clean({ force: true }));
      gulp.src('./public/css/*.map').pipe(clean({ force: true }));

      // Se toman todos los archivos de la carpeta public/src/scss
      gulp.src(['./public/src/scss/*.scss', './public/src/scss/*.css'])
          .pipe(plumber())
          .pipe(sass())
          .pipe(autoprefixer({
            browsers: [ 'last 8 Chrome versions', 'last 8 Firefox versions', 'last 8 Explorer versions', 'last 8 Edge versions', 'last 8 iOS versions', 'last 8 Opera versions', 'last 8 Safari versions', 'last 8 ExplorerMobile versions', 'last 8 Android versions', 'last 8 BlackBerry versions', 'last 8 ChromeAndroid versions', 'last 8 FirefoxAndroid versions', 'last 8 OperaMobile versions', 'last 8 OperaMini versions', 'last 8 Samsung versions', 'last 8 UCAndroid versions' ],
            cascade: false
          }))
          .pipe(cssnano())
          .pipe(rename({ suffix: '.min' }))
          .pipe(gulp.dest('./public/css/'))
          .pipe(browserSync.stream());
    });

//  ECMAS 6
    gulp.task('babel:dev', () => {
      // Se toman todos los archivos de la carpeta public/src/scss
      gulp.src('./public/src/babel/*.js')
          .pipe(plumber())
          .pipe(sourcemaps.init())
          .pipe(babel({ presets: ['es2015', 'es2016', 'es2017'] }))
          .pipe(sourcemaps.write())
          .pipe(rename({ suffix: '.min' }))
          .pipe(gulp.dest('./public/js/'))
          .pipe(browserSync.stream());
    });
    gulp.task('babel:prod', () => {
      // Se borran todos los archivos de la carpeta public/js
      gulp.src('./public/js/*.js').pipe(clean({ force: true }));
      gulp.src('./public/js/*.map').pipe(clean({ force: true }));

      // Se toman todos los archivos de la carpeta public/src/scss
      gulp.src('./public/src/babel/*.js')
          .pipe(plumber())
          .pipe(babel({ presets: ['es2015', 'es2016', 'es2017'] }))
          .pipe(concat('app.js'))
          .pipe(gulp.dest('./public/js/'))
          .pipe(rename({ suffix: '.min' }))
          .pipe(browserSync.stream());
    });

//  Watch
    gulp.task('watch:dev', () => {
      gulp.watch('./public/src/babel/*.js',   ['babel:dev']);
      gulp.watch('./public/src/scss/*.scss',  ['sass:dev']);
      gulp.watch('./public/src/view/*.html',  ['view:dev']);
    });
    gulp.task('watch:prod', () => {
      gulp.watch('./public/src/babel/*.js',   ['babel:prod']);
      gulp.watch('./public/src/scss/*.scss',  ['sass:prod']);
      gulp.watch('./public/src/view/*.html',  ['view:prod']);
    });

//  Desarrollo
    gulp.task('dev', ['view:dev', 'sass:dev', 'babel:dev', 'watch:dev', 'server']);

//  Production
    gulp.task('prod', ['view:prod', 'sass:prod', 'babel:prod', 'watch:prod', 'server']);
