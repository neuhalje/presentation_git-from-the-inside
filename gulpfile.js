 /*!
  * This file is automatically generated by tangling doc/BUILD.org
  *
  * git-from-the-inside 0.0.1
  *
  * https://github.com/neuhalje/git-from-the-inside
  * Licensed under CC-BY-SA-4.0
  *
  * Copyright (C) 2020 Jens Neuhalfen, https://neuhalfen.name/
 */

const pkg = require('./package.json')

const { series, parallel } = require('gulp')
const { src, dest } = require('gulp')

const { rollup } = require('rollup')
const { terser } = require('rollup-plugin-terser')
const Vinyl = require('vinyl')

const path = require('path')

const $ = {
    if : require('gulp-if'),
    newer : require('gulp-newer'),
    filter : require('gulp-filter'),
    rename : require('gulp-rename'),

    path : require('path'),
    glob : require('glob'),
    yargs : require('yargs'),
    colors : require('colors'),

    // Testing
    qunit : require('node-qunit-puppeteer'),

    babel : require('@rollup/plugin-babel').default,
    commonjs : require('@rollup/plugin-commonjs'),
    resolve : require('@rollup/plugin-node-resolve').default,

    tap : require('gulp-tap'),
    zip : require('gulp-zip'),
    sass : require('gulp-sass'),
    header : require('gulp-header'),
    eslint : require('gulp-eslint'),
    minify : require('gulp-clean-css'),
    connect : require('gulp-connect'),
    autoprefixer : require('gulp-autoprefixer'),
    merge : require('merge-stream'),
    shell : require('gulp-shell'),
    fs   : require('fs'),
    log   : require('fancy-log'),
    sourcemaps   : require('gulp-sourcemaps')
}

const root = $.yargs.argv.root || pkg.cfg.paths.dist.base // .cfg.paths.dist.base := "./public/"
const port = $.yargs.argv.port || 8000

const banner = `/*!
 * ${pkg.name}  ${pkg.version}
 * ${pkg.homepage}
 * ${pkg.license}
 *
 * ${pkg.copyright} ${pkg.author.name}, ${pkg.author.web}
*/
`

process.setMaxListeners(20)

function string_src(filename, string) {
  var src = require('stream').Readable({ objectMode: true })
  src._read = function () {
    this.push(new Vinyl({
      cwd: '',
      base: null,
      path: filename,
      contents: Buffer.from(string)
    }))
    this.push(null)
  }
  return src
}

/*
 * Scripts to get things from src to build.
 */

function src_root_to_build() {
  $.log(`-> Copy all files from ${pkg.cfg.paths.src.base} to ${pkg.cfg.paths.build.base}`)

  return src(pkg.cfg.paths.src.base + '*', { nodir: true }) // .cfg.paths.src.base := "./src/"
    .pipe(dest(pkg.cfg.paths.build.base))  // .cfg.paths.build.base := "./build/"
}

function src_img_to_build() {
  $.log(`-> Copy img from ${pkg.cfg.paths.src.img} to ${pkg.cfg.paths.build.img}`)

  return src(pkg.cfg.paths.src.img + '**/*.{png,jpg,jpeg,gif,svg}') // .cfg.paths.src.img := "./src/img/"
    .pipe(dest(pkg.cfg.paths.build.img))                            // .cfg.paths.build.img := "./build/img/"
}

function src_lint_js() {
  $.log(`-> Linting in from ${[pkg.cfg.paths.src.js + '**/*.js', 'gulpfile.js']}`)

  return src([pkg.cfg.paths.src.js + '**/*.js', 'gulpfile.js']) // .cfg.paths.src.js := "./src/js/"
        .pipe($.eslint())
        .pipe($.eslint.format())
}

function src_copy_js_to_build() {
  $.log("-> Copy js to build")

  return src(pkg.cfg.paths.src.js + '**/*.js') // .cfg.paths.src.js := "./src/js/"
    .pipe($.header(banner))
    .pipe(dest(pkg.cfg.paths.build.js))        // .cfg.paths.build.js := "./build/js/"
}

function src_js_to_build_compose() {
  return series(src_lint_js, src_copy_js_to_build)
}

function src_css_to_build() {
  $.log("-> Copy css to build")

  return src(pkg.cfg.paths.src.css + '**/*.css') // .cfg.paths.src.css := "./src/css/"
        .pipe($.sourcemaps.init({loadMaps: true}))
        .pipe($.autoprefixer())
        .pipe($.sourcemaps.write("./"))
        .pipe(dest(pkg.cfg.paths.build.css))     // .cfg.paths.build.css := "./build/css/"
}

function src_scss_to_build() {
  $.log("-> Compiling scss to build")

  return src(pkg.cfg.paths.src.scss + '**/*.scss') // .cfg.paths.src.scss := "./src/scss/"
        .pipe($.sourcemaps.init({loadMaps: true}))
        .pipe($.sass({includePaths: pkg.cfg.paths.include.scssIncludePaths /* .cfg.paths.include.scssIncludePaths := [] */
            })
            .on("error", $.sass.logError))
        .pipe($.autoprefixer())
        .pipe($.sourcemaps.write("./"))
        .pipe(dest(pkg.cfg.paths.build.css))       // .cfg.paths.build.css := "./build/css/"
}

function src_to_build_compose() {
  return parallel(src_root_to_build,
                      src_img_to_build,
                      src_js_to_build_compose(),
                      src_css_to_build,
                      src_scss_to_build)
}
// Enable for debugging: exports.src_to_build = src_to_build_compose()

function node_modules_reveal_js_to_build() {
  const dst = pkg.cfg.paths.build.js + 'reveal.js'
  $.log(`-> Copy reveal.js to ${dst}`)

  return src(["node_modules/reveal.js/**/*"])
        .pipe(dest(dst))

}

function node_modules_hpcc_js_to_build() {
  const dst = pkg.cfg.paths.build.js + '@hpcc-js/wasm/dist'
  $.log(`-> Copy @hpcc-js/wasm to ${dst}`)

  return src(["node_modules/@hpcc-js/wasm/dist/**/*"])
        .pipe(dest(dst))
}

function node_modules_d3_to_build() {
  const dst = pkg.cfg.paths.build.js
  $.log(`-> Copy d3 to ${dst}`)

  return src(["node_modules/d3/dist/d3.min.js"])
        .pipe(dest(dst))
}

function node_modules_d3_graphviz_to_build() {
  const dst = pkg.cfg.paths.build.js
  $.log(`-> Copy d3-graphviz to ${dst}`)

  return src(["node_modules/d3-graphviz/build/d3-graphviz.js"])
        .pipe(dest(dst))
}

function node_modules_d3_to_build_compose() {
  return parallel(node_modules_hpcc_js_to_build,
                  node_modules_d3_to_build,
                  node_modules_d3_graphviz_to_build)
}

function node_modules_mathjax_to_build() {
  $.log("-> Copy mathjax to build")

  return src(["node_modules/mathjax/es5/tex-chtml.js"])
        .pipe(dest(pkg.cfg.paths.build.js))
}

function node_modules_to_build_compose() {
  return parallel(node_modules_reveal_js_to_build,
                  node_modules_d3_to_build_compose(),
                  node_modules_mathjax_to_build)
}
// Enable for debugging: exports.node_modules_to_build = node_modules_to_build_compose()

function build_prepare_build_compose() {
    return parallel(node_modules_to_build_compose(),
                    src_to_build_compose())
}
exports.prepare_build = build_prepare_build_compose()

function build_org_file_with_docker_compose()
{
    const docker_image = pkg.cfg.vars.build_org_docker_local
    const build_dir = path.join(__dirname, pkg.cfg.paths.build.base)

    $.log(`-> Building org files with docker image ${docker_image}. Mounting ${build_dir}`)
    const docker_cmd = `docker run --rm -v ${build_dir}:/tmp/build  ${docker_image}  /root/convert-to-html.sh /tmp/build`

    $.log(docker_cmd)

    return $.shell.task(docker_cmd)
}
// exports.build_org_file_with_docker = build_org_file_with_docker_compose()

exports.finish_build = series(build_prepare_build_compose(),
                           build_org_file_with_docker_compose())

function build_gather_node_modules_licenses(cb) {
    const dst = pkg.cfg.paths.dist.base
    const filename = pkg.cfg.vars.licenses
    $.log(`-> Gathering all (potentially distributed) licenes from node_modules to ${dst}${filename}`)

    const checker = require('license-checker')
    const treeify = require('treeify')

    checker.init({
        start: '.',
        production: true,
        development: false
    }, function(err, packages) {
        if (err) {
            cb(new Error('kaboom: ' + err));
        } else {
            string_src(filename,  treeify.asTree(packages, true))
                .pipe(dest(dst))
            cb()
        }
    })
}
// exports.node_licenses = build_gather_node_modules_licenses

function public_copy_from_build() {
  return src(pkg.cfg.paths.build.base)
        .pipe($.filter(["**/*", "!*.tmp"]))
        .pipe(dest(pkg.cfg.paths.dist.base))
}
exports.publish = series(exports.finish_build,
                         parallel(public_copy_from_build,
                                  build_gather_node_modules_licenses))
