////////////////////////////////////////////////////////////////////////////////
// GULP PLUGINS
const gulp              = require('gulp'),
      gulpif            = require('gulp-if'),
      csso              = require('gulp-csso'),
      sass              = require('gulp-sass'),
      clean             = require('gulp-clean'),
      babel             = require('gulp-babel'),
      // notify            = require('gulp-notify'),
      concat            = require('gulp-concat'),
      rename            = require('gulp-rename'),
      uglify            = require('gulp-uglify'),
      htmlmin           = require('gulp-htmlmin'),
      plumber           = require('gulp-plumber'),
      sequence          = require('gulp-sequence'),
      decomment         = require('gulp-decomment'),
      removeLogs        = require('gulp-removelogs'),
      sourcemaps        = require('gulp-sourcemaps'),
      special           = require('gulp-special-html'),
      autoprefixer      = require('gulp-autoprefixer'),
      stripCssComments  = require('gulp-strip-css-comments'),
      browserSync       = require('browser-sync').create();

////////////////////////////////////////////////////////////////////////////////
// OPTIONS
let options = {
  // options views
  htmlmin: {
    removeStyleLinkTypeAttributes: true,
    removeScriptTypeAttributes: true,
    collapseBooleanAttributes: true,
    removeRedundantAttributes: true,
    removeEmptyAttributes: true,
    removeAttributeQuotes: true,
    collapseWhitespace: true,
    removeOptionalTags: true,
    useShortDoctype: true,
    removeComments: true,
    minifyURLs: true,
    minifyCSS: true,
    minifyJS: true
  },
  special: {},
  // options styles
  sass: { precision: 2 },
  stripCssComments: {},
  autoprefixer: { browsers: ['last 30 versions', '> 1%', 'ie 9'], cascade: false },
  csso: { restructure: true, sourceMap: false, debug: false },
  // options scripts
  babel: { presets: ['es2015', 'es2016', 'es2017'] },
  removeLogs: {},
  uglify: {},
  decomment: { trim: true },
  // options global
  rename: { suffix: '.min' },
  sourcemaps: { largeFile: true }
};

////////////////////////////////////////////////////////////////////////////////
// ENTORNO
let entorno         = { state: 'desarrollo' }; // opciones: desarrollo, produccion
    entorno.ext     = (entorno.state === 'produccion') ? ('.min') : ('');
    entorno.isProd  = (entorno.state === 'produccion') ? (true) : (false);

////////////////////////////////////////////////////////////////////////////////
// SERVIDOR
gulp.task('start_server', () => browserSync.init({
  server: { baseDir: './' },
  logPrefix: 'Modernización',
  host: 'localhost',
  // tunnel: 'visualizaciones',
  port: 9000, online: true,
  browser: ['google chrome'],
  logLevel: 'info', ui: false,
}));

////////////////////////////////////////////////////////////////////////////////
// CLONAR ARCHIVOS DE NODE_MODULES
gulp.task('import_scripts', () => gulp.src([
  `./node_modules/jquery/dist/jquery.min.js`,
  `./node_modules/bootstrap/dist/js/bootstrap.min.js`,
  `./node_modules/d3/build/d3.min.js`
]).pipe(concat('00_import_plugins.js')).pipe(gulp.dest('./build/scripts/temp/')));
gulp.task('import_styles',  () => gulp.src([
  `./node_modules/bootstrap/dist/css/bootstrap.min.css`,
  // `./node_modules/argob-poncho/dist/css/poncho.min.css`,
  // `./node_modules/argob-poncho/dist/css/roboto-fontface.css`
]).pipe(concat('00_plugins_import.css')).pipe(gulp.dest('./build/styles/temp/')));
gulp.task('import_fonts',   () => gulp.src([
  './node_modules/bootstrap/dist/fonts/*.*'
]).pipe(gulp.dest('./build/fonts/temp')));
gulp.task('import_all',     sequence(['import_scripts','import_styles','import_fonts']));

////////////////////////////////////////////////////////////////////////////////
// views task
gulp.task('html',            () => gulp.src('./build/views/*.html')
  .pipe( plumber() )
  .pipe( htmlmin(options.htmlmin) )
  .pipe( special(options.special) )
  .pipe(gulp.dest('./'))
  .pipe(browserSync.stream()));

gulp.task('delete_views',    () => gulp.src('./*.html')
  .pipe(clean({ force: true })));
gulp.task('build_views',     (callback) => sequence('html')(callback));
gulp.task('watch_views',     () => gulp.watch('./build/views/*.html', ['build_views']));

////////////////////////////////////////////////////////////////////////////////
// styles task
gulp.task('sass_plugins',    () => gulp.src(['./build/styles/plugins/*.*', '!./build/styles/plugins/old_*.*'])
  .pipe(plumber())
  .pipe(concat('01_local_plugins.css'))
  .pipe(sass(options.sass))
  .pipe(gulp.dest('./build/styles/temp/')));
gulp.task('sass',            () => gulp.src(['./build/styles/*.*', '!./build/styles/_*.*', '!./build/styles/old_*.*'])
  .pipe(plumber())
  .pipe(concat('02_local_app.css'))
  .pipe(sass(options.sass))
  .pipe(gulp.dest('./build/styles/temp/')));
gulp.task('css',             () => gulp.src('./build/styles/temp/*.css')
  .pipe(plumber())
  .pipe(concat('03_final_app.css'))
  .pipe( stripCssComments(options.stripCssComments) )
  .pipe(autoprefixer(options.autoprefixer))
  .pipe( csso(options.csso) )
  .pipe(gulp.dest('./build/styles/temp/')));
gulp.task('sourcemap_css',   () => gulp.src('./build/styles/temp/*final_app.css')
  .pipe(plumber())
  .pipe(concat('app.css'))
  // .pipe(gulpif(!entorno.isProd, sourcemaps.init(options.sourcemaps)))
  // .pipe(gulpif(!entorno.isProd, sourcemaps.write('')))
  .pipe(gulp.dest('./public/styles/'))
  .pipe(browserSync.stream()));
gulp.task('delete_styles',   () => gulp.src(['./build/styles/temp', './public/styles'])
  .pipe(clean({ force: true })));
gulp.task('rebuild_styles',  (callback) => sequence('delete_styles', 'import_styles', 'sass_plugins', 'sass', 'css', 'sourcemap_css')(callback));
gulp.task('build_styles',    (callback) => sequence('sass_plugins', 'sass', 'css', 'sourcemap_css')(callback));
gulp.task('watch_styles',    () => gulp.watch('./build/styles/**/*.scss', ['rebuild_styles']));

////////////////////////////////////////////////////////////////////////////////
// scripts task
gulp.task('babel_plugins',   () => gulp.src(['./build/scripts/plugins/*.js', '!./build/scripts/plugins/old_*.*'])
  .pipe( plumber() )
  .pipe( concat('01_local_plugins.js') )
  .pipe( babel(options.babel) )
  // .pipe( uglify() )
  .pipe( removeLogs(options.removeLogs) )
  .pipe( gulp.dest('./build/scripts/temp/')) );
gulp.task('babel',           () => gulp.src(['./build/scripts/*.js', '!./build/scripts/old_*.*'])
  .pipe( plumber() )
  .pipe( concat('02_local_app.js') )
  .pipe( babel(options.babel) )
  .pipe( uglify() )
  .pipe(gulp.dest('./build/scripts/temp/')));
gulp.task('javascript',      () => gulp.src('./build/scripts/temp/*.js')
  .pipe( plumber() )
  .pipe( concat('03_final_app.js') )
  .pipe( decomment(options.decomment) )
  .pipe(gulp.dest('./build/scripts/temp/')));
gulp.task('sourcemap_js',    () => gulp.src('./build/scripts/temp/*final_app.js')
  .pipe(plumber())
  .pipe(concat('app.js'))
  // .pipe(gulpif(!entorno.isProd, sourcemaps.init(options.sourcemaps)))
  // .pipe(gulpif(!entorno.isProd, sourcemaps.write('')))
  .pipe(gulp.dest('./public/scripts/'))
  .pipe(browserSync.stream()));
gulp.task('delete_scripts',  () => gulp.src(['./build/scripts/temp', './public/scripts'])
  .pipe(clean({ force: true })));
gulp.task('rebuild_scripts', (callback) => sequence('delete_scripts', 'import_scripts', 'babel_plugins', 'babel', 'javascript', 'sourcemap_js')(callback));
gulp.task('build_scripts',   (callback) => sequence('babel_plugins', 'babel', 'javascript', 'sourcemap_js')(callback));
gulp.task('watch_scripts',   () => gulp.watch('./build/scripts/**/*.js', ['rebuild_scripts']));

////////////////////////////////////////////////////////////////////////////////
// VARIOS
gulp.task('images', () => gulp.src('./build/images/*.*')
  .pipe(plumber())
  .pipe(gulp.dest('./public/images/')));
gulp.task('fonts', () => gulp.src(['./build/fonts/*.*', './build/fonts/temp/*.*'])
  .pipe(plumber())
  .pipe(gulp.dest('./public/fonts/')));
gulp.task('data', () => gulp.src('./build/data/**/*')
  .pipe(plumber())
  .pipe(gulp.dest('./public/data/')));

////////////////////////////////////////////////////////////////////////////////
// watches task
gulp.task('watch', sequence(['watch_scripts', 'watch_styles', 'watch_views']));

////////////////////////////////////////////////////////////////////////////////
// reset task
gulp.task('reset_app', () => gulp.src([
  './build/scripts/temp',
  './build/styles/temp',
  './build/fonts/temp',
  './public',
  './*.html'
]).pipe(clean({ force: true })));

////////////////////////////////////////////////////////////////////////////////
// compilers
gulp.task('server', sequence('watch', 'start_server'));
gulp.task('compile', sequence(
  'reset_app',
  ['import_all', 'images', 'fonts', 'data'],
  'build_views',
  'build_styles',
  'build_scripts',
  'fonts'
));
gulp.task('start', sequence('compile', 'server'));
