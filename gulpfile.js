let project_folder = require("path").basename(__dirname);
let source_folder = "src";

let fs = require("fs");
let execSync = require("child_process").execSync;

let path = {
  build: {
    html: project_folder + "/",
    css: project_folder + "/css/",
    js: project_folder + "/js/",
    img: project_folder + "/img/",
    fonts: project_folder + "/fonts/",
    audio: project_folder + "/audio/",
  },
  src: {
    html: [source_folder + "/**/*.html"],
    css: source_folder + "/css/tailwind.css",
    js: source_folder + "/js/script.js",
    img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
    fonts: [source_folder + "/fonts/*.ttf", source_folder + "/fonts/*.woff", source_folder + "/fonts/*.woff2"],
    audio: source_folder + "/audio/*.mp3",
  },
  watch: {
    html: source_folder + "/**/*.html",
    css: source_folder + "/css/**/*.css",
    js: source_folder + "/js/**/*.js",
    img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
    audio: source_folder + "/audio/*.mp3",
  },
  clean: "./" + project_folder + "/",
};

let { src, dest } = require("gulp"),
  gulp = require("gulp"),
  browsersync = require("browser-sync").create(),
  fileinclude = require("gulp-file-include"),
  del = require("del"),
  scss = require("gulp-sass")(require("sass")),
  autoprefixer = require("gulp-autoprefixer"),
  // group_media = require("gulp-group-css-media-queries"),
  // clean_css = require("gulp-clean-css"),
  lightningcss = require("gulp-lightningcss"),
  rename = require("gulp-rename"),
  // uglify = require("gulp-uglify-es").default,
  terser = require("gulp-terser"),
  // postcss = require("gulp-postcss"),
  // cssnano = require("cssnano"),
  // cssVariables = require("postcss-css-variables");
  ghpages = require("gh-pages"),
  replace = require("gulp-replace"),
  cheerio = require("gulp-cheerio");

((imagemin = require("gulp-imagemin")),
  (svgSprite = require("gulp-svg-sprite")),
  (ttf2woff = require("gulp-ttf2woff")),
  (ttf2woff2 = require("gulp-ttf2woff2")),
  (fonter = require("gulp-fonter")),
  (deploy = require("gulp-gh-pages")));

function browserSync(done) {
  browsersync.init({
    server: {
      baseDir: "./" + project_folder + "/",
    },
    port: 3000,
    notify: false,
  });
}

function html() {
  return src(path.src.html).pipe(fileinclude()).pipe(dest(path.build.html)).pipe(browsersync.stream());
}

// function css() {
//   return (
//     src(path.src.css)
//       .pipe(
//         autoprefixer({
//           overrideBrowserslist: ["last 5 versions"],
//           cascade: true,
//         }),
//       )
//       .pipe(dest(path.build.css))
//       // .pipe(lightningcss())
//       .pipe(
//         rename({
//           extname: ".min.css",
//         }),
//       )
//       .pipe(dest(path.build.css))
//       .pipe(browsersync.stream())
//   );
// }

function css() {
  return src("src/css/style.css")
    .pipe(rename({ basename: "style", extname: ".css" })) 
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
        extname: ".min.js",
      }),
    )
    .pipe(dest(path.build.js))
    .pipe(browsersync.stream());
}

function images() {
  return (
    src(path.src.img)
      // .pipe(
      //   imagemin({
      //     progressive: true,
      //     svgoPlugins: [{ removeViewBox: false }],
      //     interlaced: true,
      //     optimizationLevel: 3, // 0 to 7
      //   })
      // )
      .pipe(dest(path.build.img))
      .pipe(browsersync.stream())
  );
}

function audio() {
  return src(path.src.audio).pipe(dest(path.build.audio)).pipe(browsersync.stream());
}

function fonts() {
  src(path.src.fonts).pipe(ttf2woff()).pipe(dest(path.build.fonts));
  return src(path.src.fonts).pipe(ttf2woff2()).pipe(dest(path.build.fonts));
}

gulp.task("otf2ttf", function () {
  return src([source_folder + "/fonts/*.otf"])
    .pipe(
      fonter({
        formats: ["ttf"],
      }),
    )
    .pipe(dest(source_folder + "/fonts/"));
});

gulp.task("svgSprite", function () {
  return gulp
    .src([source_folder + "/iconsprite/*.svg"])
    .pipe(
      svgSprite({
        mode: {
          stack: {
            sprite: "../icons/icons.svg", //sprite file name
            example: true,
          },
        },
      }),
    )
    .pipe(dest(path.build.img));
});

gulp.task("deploy", function () {
  return gulp.src("./skko-redesign/**/*").pipe(deploy());
});

function cb() {}

function watchFiles(params) {
  gulp.watch([path.watch.html], html);
  gulp.watch([path.watch.css], css);
  gulp.watch([path.watch.js], js);
  gulp.watch([path.watch.img], images);
  gulp.watch([path.watch.audio], audio);
}

function clean(params) {
  return del(path.clean);
}

function deployTask(done) {
  // Читаем имя проекта из package.json и формируем репозиторий ИМЯ-demo
  let pkg = {};
  try {
    pkg = JSON.parse(fs.readFileSync("package.json", "utf8")) || {};
  } catch (e) {
    console.warn("Не удалось прочитать package.json, используем имя папки проекта:", e.message);
  }
  const baseName = (pkg && (pkg.description || pkg.name)) || project_folder;
  const targetRepoName = baseName + "-demo";

  // Определяем владельца GitHub из origin и сохраняем протокол (ssh/https)
  let originUrl = "";
  try {
    originUrl = execSync("git config --get remote.origin.url", {
      encoding: "utf8",
    }).trim();
  } catch (e) {
    console.warn("Не удалось получить origin url из git:", e.message);
  }
  let owner = null;
  let proto = "https";
  if (originUrl) {
    const m = originUrl.match(/github\.com[:\/]([^\/]+)\//i);
    owner = m ? m[1] : null;
    proto = originUrl.startsWith("git@") ? "ssh" : "https";
  }
  const targetRepoUrl = owner
    ? proto === "ssh"
      ? "git@github.com:" + owner + "/" + targetRepoName + ".git"
      : "https://github.com/" + owner + "/" + targetRepoName + ".git"
    : "";

  ghpages.publish(
    "./" + project_folder,
    {
      branch: "gh-pages",
      repo: targetRepoUrl, // Пушим в репозиторий ИМЯ-demo того же владельца
      message: "Deploy to GitHub Pages - " + new Date().toISOString(),
      force: true, // Принудительно обновляем
      dotfiles: true, // Включаем скрытые файлы
    },
    function (err) {
      if (err) {
        console.error("Deploy failed:", err);
      } else {
        console.log("Deploy successful! Ветка gh-pages, репозиторий:", targetRepoUrl || "(текущий)");
      }
      done(err);
    },
  );
}

// Специальный вотчер для задачи lorem: заменяет html-обработчик на loremGenerate
function watchFilesLorem(params) {
  gulp.watch([path.watch.html], loremGenerate);
  gulp.watch([path.watch.css], css);
  gulp.watch([path.watch.js], js);
  gulp.watch([path.watch.img], images);
  gulp.watch([path.watch.audio], audio);
}

// Генерирует строку из "рыбы" заданной длины символов
function generateLoremByLength(targetLength) {
  if (!Number.isFinite(targetLength) || targetLength <= 0) return "";
  const base = (
    "Lorem ipsum dolor sit amet consectetur adipisicing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua " +
    "Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat " +
    "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur " +
    "Excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum "
  ).repeat(20); // запас по длине
  return base.replace(/\s+/g, " ").slice(0, targetLength);
}

function loremGenerate() {
  return (
    src(path.src.html)
      .pipe(
        fileinclude({
          prefix: "@@",
          basepath: "@file",
          indent: true,
        }),
      )
      .on("error", function (err) {
        console.error("fileinclude error in loremGenerate():", err.message);
        this.emit("end");
      })
      // Безопасная DOM-замена текста через cheerio: только текстовые узлы
      .pipe(
        cheerio({
          run: function ($) {
            const excluded = new Set(["script", "style", "head", "html", "body", "meta", "link", "title", "svg", "noscript"]);
            $("*").each(function () {
              const el = this;
              if (excluded.has(el.tagName && el.tagName.toLowerCase())) {
                return;
              }
              $(el)
                .contents()
                .filter(function () {
                  return this.type === "text";
                })
                .each(function () {
                  const original = this.data;
                  if (original && original.trim().length > 0) {
                    const m = original.match(/^(\s*)([\s\S]*?)(\s*)$/);
                    const leading = m ? m[1] : "";
                    const core = m ? m[2] : original;
                    const trailing = m ? m[3] : "";
                    this.data = leading + generateLoremByLength(core.length) + trailing;
                  }
                });
            });
          },
          parserOptions: { decodeEntities: false },
        }),
      )
      .pipe(dest(path.build.html))
      .pipe(browsersync.stream())
  );
}

let build = gulp.series(clean, gulp.parallel(js, css, html, images, fonts, audio));
let lorem = gulp.series(build, loremGenerate, gulp.parallel(watchFilesLorem, browserSync));
let watch = gulp.parallel(build, watchFiles, browserSync);

exports.fonts = fonts;
exports.images = images;
exports.audio = audio;
exports.js = js;
exports.css = css;
exports.html = html;
exports.lorem = lorem;
exports.build = build;
exports.watch = watch;
exports.deploy = deployTask;
exports.default = watch;
