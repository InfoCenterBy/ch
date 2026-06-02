let nodePath = require('path');
let { spawn, spawnSync } = require('child_process');
let project_folder = nodePath.basename(__dirname);
let source_folder = 'src';

let tailwindInput = nodePath.join(__dirname, source_folder, 'css', 'tailwind.css');
let tailwindOutput = nodePath.join(__dirname, project_folder, 'css', 'style.css');
let tailwindWatchProc = null;

function tailwindCliArgs(extraFlags) {
  return ['@tailwindcss/cli', '-i', tailwindInput, '-o', tailwindOutput, ...extraFlags];
}

function tailwindBuild(done) {
  let r = spawnSync('npx', tailwindCliArgs(['--minify']), {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true,
  });
  if (r.error) return done(r.error);
  if (r.status !== 0) return done(new Error('Tailwind CLI exited with code ' + r.status));
  done();
}

function tailwindWatch(done) {
  tailwindWatchProc = spawn('npx', tailwindCliArgs(['--watch', '--minify']), {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true,
  });
  tailwindWatchProc.on('error', (err) => console.error('Tailwind watch:', err));
  done();
}

function killTailwindWatch() {
  if (tailwindWatchProc && !tailwindWatchProc.killed) {
    tailwindWatchProc.kill('SIGTERM');
    tailwindWatchProc = null;
  }
}

process.once('exit', killTailwindWatch);
['SIGINT', 'SIGTERM'].forEach((sig) => {
  process.once(sig, () => {
    killTailwindWatch();
    // Re-emit the original signal so gulp can shut down gracefully.
    process.kill(process.pid, sig);
  });
});

let path = {
  build: {
    html: project_folder + '/',
    css: project_folder + '/css/',
    js: project_folder + '/js/',
    img: project_folder + '/img/',
    fonts: project_folder + '/fonts/',
  },
  src: {
    html: [source_folder + '/**/*.html'],
    css: source_folder + '/css/style.css',
    js: source_folder + '/js/script.js',
    jsLibs: [
      source_folder + '/js/libs/**/*.js',
      'node_modules/flatpickr/dist/flatpickr.min.js',
      'node_modules/flatpickr/dist/l10n/ru.js',
    ],
    img: source_folder + '/img/**/*.{jpg,png,svg,gif,ico,webp}',
    fonts: [
      source_folder + '/fonts/*.ttf',
      source_folder + '/fonts/*.woff',
      source_folder + '/fonts/*.woff2',
    ],
  },
  watch: {
    html: source_folder + '/**/*.html',
    js: source_folder + '/js/**/*.js',
    img: source_folder + '/img/**/*.{jpg,png,svg,gif,ico,webp}',
  },
  clean: './' + project_folder + '/',
};

let { src, dest } = require('gulp'),
  gulp = require('gulp'),
  browsersync = require('browser-sync').create(),
  fileinclude = require('gulp-file-include'),
  del = require('del'),
  rename = require('gulp-rename'),
  terser = require('gulp-terser');

((ttf2woff = require('gulp-ttf2woff')),
  (ttf2woff2 = require('gulp-ttf2woff2')),
  (fonter = require('gulp-fonter')),
  (deploy = require('gulp-gh-pages')));

function browserSync(done) {
  browsersync.init({
    server: {
      baseDir: './' + project_folder + '/',
    },
    port: 3000,
    notify: false,
  });
  done();
}

function html() {
  return src(path.src.html)
    .pipe(fileinclude())
    .pipe(dest(path.build.html))
    .pipe(browsersync.stream());
}

function js() {
  return src(path.src.js)
    .pipe(fileinclude())
    .pipe(dest(path.build.js))
    .pipe(
      terser({
        keep_fnames: true,
        mangle: false,
      }),
    )
    .pipe(
      rename({
        extname: '.min.js',
      }),
    )
    .pipe(dest(path.build.js))
    .pipe(browsersync.stream());
}

function jsLibs() {
  return src(path.src.jsLibs).pipe(dest(path.build.js)).pipe(browsersync.stream());
}

function images() {
  return src(path.src.img).pipe(dest(path.build.img)).pipe(browsersync.stream());
}

function fonts() {
  src(path.src.fonts).pipe(ttf2woff()).pipe(dest(path.build.fonts));
  return src(path.src.fonts).pipe(ttf2woff2()).pipe(dest(path.build.fonts));
}

gulp.task('otf2ttf', function () {
  return src([source_folder + '/fonts/*.otf'])
    .pipe(
      fonter({
        formats: ['ttf'],
      }),
    )
    .pipe(dest(source_folder + '/fonts/'));
});

gulp.task('deploy', function () {
  return gulp.src('./ch/**/*').pipe(deploy());
});

function watchFiles(params) {
  gulp.watch([path.watch.html], html);
  gulp.watch([project_folder + '/css/**/*.css'], (done) => {
    browsersync.reload();
    done();
  });
  gulp.watch([path.watch.js], gulp.parallel(js, jsLibs));
  gulp.watch([path.watch.img], images);
}

function clean(params) {
  return del(path.clean);
}

let build = gulp.series(clean, gulp.parallel(tailwindBuild, js, jsLibs, html, images, fonts));
let watch = gulp.series(build, gulp.parallel(watchFiles, browserSync, tailwindWatch));

exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.jsLibs = jsLibs;
exports.html = html;
exports.tailwindBuild = tailwindBuild;
exports.build = build;
exports.watch = watch;
exports.default = watch;
