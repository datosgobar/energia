# Gulp Rucksack
[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url]

Gulp plugin for [Rucksack][rucksack] - a little bag of CSS superpowers.

Inspired by [gulp-cssnano][cssnano].

### Install

Install via [npm][npm-url]

```sh
$ npm install gulp-rucksack --save-dev
```

--

### Usage

```js
var gulp = require('gulp');
var rucksack = require('gulp-rucksack');

gulp.task('rucksack', function() {
  return gulp.src('src/style.css')
    .pipe(rucksack())
    .pipe(gulp.dest('style.css'));
});
```
--

### Source Maps

gulp-rucksack supports [gulp-sourcemaps][gulp-sourcemaps]

```js
var gulp = require('gulp');
var rucksack = require('gulp-rucksack');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('rucksack', function() {
  return gulp.src('src/style.css')
    .pipe(sourcemaps.init())
    .pipe(rucksack())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('style.css'));
});
```

[npm-image]: https://badge.fury.io/js/gulp-rucksack.svg
[npm-url]: https://npmjs.org/package/gulp-rucksack
[travis-image]: https://travis-ci.org/simplaio/gulp-rucksack.svg?branch=master
[travis-url]: https://travis-ci.org/simplaio/gulp-rucksack
[daviddm-image]: https://david-dm.org/simplaio/gulp-rucksack.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/simplaio/gulp-rucksack
[rucksack]: https://github.com/simplaio/rucksack
[gulp]:    https://github.com/gulpjs/gulp
[gulp-sourcemaps]: https://www.npmjs.com/package/gulp-sourcemaps
[cssnano]: https://github.com/ben-eb/gulp-cssnano
