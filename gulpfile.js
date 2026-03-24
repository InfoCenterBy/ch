let nodePath = require('path');
let { spawn, spawnSync } = require('child_process');
let project_folder = nodePath.basename(__dirname);
let source_folder = 'src';

let tailwindInput = nodePath.join(__dirname, source_folder, 'css', 'tailwind.css');
let tailwindOutput = nodePath.join(__dirname, source_folder, 'css', 'style.css');
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
  process.on(sig, () => {
    killTailwindWatch();
  });
});

let path = {
  build: {
    html: project_folder + '/',
    css: project_folder + '/css/',
    js: project_folder + '/js/',
    img: project_folder + '/img/',
    fonts: project_folder + '/fonts/',
    audio: project_folder + '/audio/',
  },
  src: {
    html: [source_folder + '/**/*.html'],
    css: source_folder + '/css/style.css',
    js: source_folder + '/js/script.js',
    jsLibs: source_folder + '/js/libs/**/*.js',
    img: source_folder + '/img/**/*.{jpg,png,svg,gif,ico,webp}',
    fonts: [
      source_folder + '/fonts/*.ttf',
      source_folder + '/fonts/*.woff',
      source_folder + '/fonts/*.woff2',
    ],
    audio: source_folder + '/audio/*.mp3',
  },
  watch: {
    html: source_folder + '/**/*.html',
    css: source_folder + '/css/**/*.css',
    js: source_folder + '/js/**/*.js',
    img: source_folder + '/img/**/*.{jpg,png,svg,gif,ico,webp}',
    audio: source_folder + '/audio/*.mp3',
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

function css() {
  return src(path.src.css)
    .pipe(rename({ basename: 'style', extname: '.css' }))
    .pipe(dest(path.build.css))
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

function audio() {
  return src(path.src.audio).pipe(dest(path.build.audio)).pipe(browsersync.stream());
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
  return gulp.src('./skko-redesign/**/*').pipe(deploy());
});

function cb() {}

function watchFiles(params) {
  gulp.watch([path.watch.html], html);
  gulp.watch([path.watch.css], css);
  gulp.watch([path.watch.js], gulp.parallel(js, jsLibs));
  gulp.watch([path.watch.img], images);
  gulp.watch([path.watch.audio], audio);
}

function clean(params) {
  return del(path.clean);
}

let build = gulp.series(
  tailwindBuild,
  clean,
  gulp.parallel(js, jsLibs, css, html, images, fonts, audio),
);
let watch = gulp.parallel(build, watchFiles, browserSync, tailwindWatch);

exports.fonts = fonts;
exports.images = images;
exports.audio = audio;
exports.js = js;
exports.jsLibs = jsLibs;
exports.css = css;
exports.html = html;
exports.tailwindBuild = tailwindBuild;
exports.build = build;
exports.watch = watch;
exports.default = watch;
