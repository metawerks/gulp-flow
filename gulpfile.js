var gulp = require('gulp');
    cache = require('gulp-cache');
    del = require('del');
    sass = require('gulp-sass');
    sourcemaps = require('gulp-sourcemaps');
    htmlmin = require('gulp-htmlmin');
    svgmin = require('gulp-svgmin');
    useref = require('gulp-useref');
    gulpIf = require('gulp-if'),
    uglify = require('gulp-uglify'),
    cleanCSS = require('gulp-clean-css');
    autoprefixer = require('gulp-autoprefixer');
    uncss = require('gulp-uncss');
    lazypipe = require('lazypipe');
    imagemin = require('gulp-imagemin');
    runSequence = require('run-sequence').use(gulp);
    browserSync = require('browser-sync');
    critical = require('critical');


// cleaning
gulp.task('clean', function() {
        return del.sync('_dist').then(function(cb) {
        return cache.clearAll(cb);
      });
    })

gulp.task('clean:dist', function() {
      return del.sync(['_dist/**/*', '!_dist/images', '!_dist/images/**/*']);
    });


    // compile sass // autoprefix & minify css
    gulp.task('sass', function () {
        return gulp.src('_src/sass/**/*.scss')
          .pipe(sourcemaps.init())
          .pipe(sass().on('error', sass.logError))
          .pipe(autoprefixer({
    			 browsers: ['last 2 versions'],
    			 cascade: false,
           remove: true
    		    }))
            .pipe(cleanCSS({keepSpecialComments:0},
              {debug: true}, function(details) {
                  console.log(details.name + ': ' + details.stats.originalSize);
                  console.log(details.name + ': ' + details.stats.minifiedSize);
                  console.log(details.name + ': ' + details.stats.efficiency);

              }))
          .pipe(sourcemaps.write('./'))
          .pipe(gulp.dest('_src/css'));
        });


    // concat & inject js & css // uglify js and minify html
    gulp.task('useref', function () {
            return gulp.src('_src/**/*.html')
                .pipe(useref({}, lazypipe().pipe(sourcemaps.init, { loadMaps: true })))
                .pipe(sourcemaps.write('maps'))
                .pipe(gulpIf('js/*.js', uglify()))
                .pipe(gulpIf('_src/**/*.html', htmlmin({collapseWhitespace: true})))
                .pipe(gulp.dest('_dist'));
        });

    // uncss
    gulp.task('uncss', function () {
            return gulp.src('_dist/css/**/*.css')
                //.pipe(sourcemaps.init())
                .pipe(uncss({
                    html: ['_dist/index.html']
                }))
                .pipe(cleanCSS())
                //.pipe(sourcemaps.write('./'))
                .pipe(gulp.dest('_dist/css/'));
        });


// Critical CSS
gulp.task('critical', function() {
      critical.generate({
          inline: true,
          base: '_dist/',
          src: 'index.html',
          dest: '_dist/index-critical.html',
          minify: true,
          dimensions: [{
              height: 1136,
              width: 640
          }, {
              height: 900,
              width: 1200
          }]
      });
    })

// optimizing images
    gulp.task('images', function() {
      return gulp.src('_src/img/**/*.+(png|jpg|jpeg|gif)')
        // Caching images that ran through imagemin
        .pipe(cache(imagemin({
          interlaced: true,
        })))
        .pipe(gulp.dest('_dist/img'))
    });

// svg images
    gulp.task('svgo', function () {
        return gulp.src('_src/img/**/*.svg')
            .pipe(svgmin())
            .pipe(gulp.dest('_dist/img'));
    });

//move svg symbol sprite symbol-stack-logos
      gulp.task('move-svg-symbols', function() {
         gulp.src('_src/img/symbols/**/*.svg')
         .pipe(gulp.dest('_dist/img/symbols'));
      });

// start browserSync server
    gulp.task('browserSync', function() {
      browserSync({
        server: {
          baseDir: '_dist'
        }
      })
    })

// watchers
    gulp.task('watch', function() {
      gulp.watch('_src/**/*.scss', function(){ runSequence('clean:dist','sass','useref','images', 'svgo', 'move-svg-symbols', 'uncss', 'critical', browserSync.reload) });
      gulp.watch('_src/**/*.js', function(){ runSequence('clean:dist','sass','useref','images', 'svgo', 'move-svg-symbols', 'uncss', 'critical', browserSync.reload) });
      gulp.watch('_src/**/*.html', function(){ runSequence('clean:dist','sass','useref','images', 'svgo', 'move-svg-symbols', 'uncss', 'critical',browserSync.reload) });
    })

    gulp.task('watch-maps', function() {
      gulp.watch('_src/**/*.scss', function(){ runSequence('clean:dist','sass','useref','images','svgo', 'move-svg-symbols', browserSync.reload) });
      gulp.watch('_src/**/*.js', function(){ runSequence('clean:dist','sass','useref','images','svgo', 'move-svg-symbols', browserSync.reload) });
      gulp.watch('_src/**/*.html', function(){ runSequence('clean:dist','sass','useref','images','svgo', 'move-svg-symbols', browserSync.reload) });
    })


// default build sequence
gulp.task('default', function(callback) {
      runSequence('clean:dist','sass','useref','images', 'svgo', 'move-svg-symbols', 'uncss', 'critical', 'browserSync', 'watch',
          callback);
      });

// no uncss - yes sourcemaps
gulp.task('maps', function(callback) {
      runSequence('clean:dist','sass','useref','images', 'svgo', 'move-svg-symbols', 'browserSync', 'watch-maps',
                callback);
            });
