- [Overview](#org6c045b4)
  - [Design decisions](#org3705c60)
  - [Directory layout](#orga5448c4)
    - [Flow between folders](#orgcd3a563)
  - [Configuration in `packages.json`](#orgdc7f51b)
  - [Edit the presentation](#orge7356df)
  - [Build and publish](#org5c9007c)
    - [`gulp default` - build `public/`](#orgeb02287)
    - [`gulp serve` - development webserver with watch](#org3fe1d3d)
    - [`gulp package` - create a ZIP](#org4f6cd06)
  - [Required tools](#org6455724)
- [Details](#org517fb06)
  - [Tools used](#orgc4fc03c)
    - [`gulp` for building](#org084370e)
    - [`reveal.js` as presentation framework](#orgb1c2709)
    - [`emacs` with `org-mode`, `org-babel`, `org-re-reveal` for writing/exporting](#org95b0fb7)
    - [`Docker` for transforming `org` to `html`](#orgaec135a)
  - [Build targets](#orga6114b0)
- [Building this document](#org60825c6)
- [Building `gulpfile.js`](#orgfdb27b5)
  - [Red Tape](#org84e9a5c)
    - [Make package.json available](#org311d475)
    - [Setup plugins for gulpfile](#org2a2916a)
    - [Configure Plugins](#org9a86263)
  - [Custom Functions](#org3b4af54)
  - [Folders](#org9c44df1)
    - [src/](#org5199f76)
    - [node\_modules/](#org78ccb83)
    - [build/](#org293d8f8)
    - [public/](#orgd2408e5)



<a id="org6c045b4"></a>

# Overview


<a id="org3705c60"></a>

## Design decisions

The whole process serves the simple matter of *creating a presentation*. That means neither bandwitdh nor page load speed are a primary consideration.

These are the primary design goals, from more general to more specific:

-   **Get the Job Done:** In the end the result in `public/` matters.
-   **Ease of Use:** The whole process must be easy to use with a [minimum set of required tools](#org6455724).
-   **Automated Build:** The whole process needs to be automated.
-   **Support for `org-mode`:** This was the trigger. I wanted to use [emacs](https://www.gnu.org/software/emacs/) with [org-mode](https://orgmode.org/), [org-babel](https://orgmode.org/worg/org-contrib/babel/), and [org-re-reveal](https://gitlab.com/oer/org-re-reveal) for writing slides.
-   **Reuseable:** The whole system should be reusable across multiple presentations. *Ideally* a new presentation just needs some bootstrap (repository) and *content*.
-   **One Pipeline Per File:** Each file *should* only be modified (e.g. minify) in exactly *one* pipeline. Changing files in multiple pipelines makes it difficult to figure out *where* things happen.
-   **Configuration in [package.json](../package.json):** Ideally (see *Reuseable*) a new presentation only needs changes in [package.json](../package.json) and [index.org](../src/index.md).


<a id="orga5448c4"></a>

## Directory layout

The directory layout is quite simple: Files are moved from `{src, node_modules}` to `build`. In `build` files are generated (e.g. `.org` &#x2013;> `.html`) and then copied to `public`.

-   **node\_modules/:** [Modules](../package.json) installed via [npm](https://www.npmjs.com/). Copied to `build/js` via specific targets. TODO targets.
-   **src/:** Source files (*read-only* during build)
    -   **.:** files that will end up in `build/` via copy. [index.org](../src/index.md) is located here. TARGET TODO
    -   **img/:** images, will be copied to `build/img/.`. TARGETxxx TODO
    -   **js/:** JavaScript files, will be copied (and potentially minified & uglified) to `build/js`. TARGETxxx TODO
    -   **css/:** CSS files, will be copied (and potentially minified) to `build/css`. TARGETxxx TODO
    -   **scss/:** [SCSS](https://sass-lang.com/documentation/syntax) files, will be run through [Sass](https://sass-lang.com/) and copied (and potentially minified) to `build/css`. TARGETxxx TODO
-   **build/:** *Not in version control*. Root folder for all build related activities. E.g. the [building of index.org](#org5c9007c) happens in here.
    -   **.:** files that will end up in `public/` via copy. Before that, files will be transformed, e.g. by creating `index.html` by running [index.org](../src/index.md). TARGET TODO
    -   **img/:** images, will be copied to `public/img/.`. TARGETxxx TODO
    -   **js/:** JavaScript files, will be copied to `public/js`. No further minification/uglification. TARGETxxx TODO
    -   **css/:** CSS files, will be copied (and potentially minified) to `public/css`. TARGETxxx TODO
-   **public/:** The final build result.
    -   **.:** Can be served via [`gulp serve`](#org3fe1d3d) and packaged as a ZIP via [`gulp package`](#org4f6cd06).
    -   **img/:** images
    -   **js/:** JavaScript files
    -   **css/:** CSS files


<a id="orgcd3a563"></a>

### Flow between folders

![img](img/flow-between-folders.png)


<a id="orgdc7f51b"></a>

## Configuration in `packages.json`


<a id="orge7356df"></a>

## Edit the presentation

The whole presentation is contained in <../src/index.md> and build via org-mode.


<a id="org5c9007c"></a>

## Build and publish

The final version will be published into the `public/` directory. Calling `gulp` (or `gulp default`) will build the whole presentation.

**It is important that the presentation is viewed via http(s)** since some JS libraries will not correctly work when served via the file system. [`gulp serve`](#org3fe1d3d) starts a small webserver for that.


<a id="orgeb02287"></a>

### `gulp default` - build `public/`

`gulp` or `gulp default` will update `public/` to the latest result.


<a id="org3fe1d3d"></a>

### `gulp serve` - development webserver with watch

`gulp serve` will start a small webserver to view the results (via [gulp-serve](https://www.npmjs.com/package/gulp-serve)).


<a id="org4f6cd06"></a>

### `gulp package` - create a ZIP

`gulp package` will create a ZIP file of `public/**/*`.


<a id="org6455724"></a>

## Required tools

-   **gulp:** Gulp is used for orchestrating the build
-   **Docker:** [index.org](../src/index.md) is compiled to html via [xuxxux/org-re-reveal-builder](https://hub.docker.com/repository/docker/xuxxux/org-re-reveal-builder) ([Dockerfile](../docker/Dockerfile))


<a id="org517fb06"></a>

# Details


<a id="orgc4fc03c"></a>

## Tools used


<a id="org084370e"></a>

### `gulp` for building

The build is automated via [gulp](https://gulpjs.com/docs/en/getting-started/quick-start/). The configuration is done via the [gulpfile.js](../gulpfile.js) and NPMs [package.json](../package.json).

-   **gulpfile.json:** Contains the workflow. The goal is to keep the gulpfile static for a lot of projects.
-   **package.json:** Configures dependencies for build (`--save-dev`), runtime (`--save-prod`) and configuration like paths, urls, globs.


<a id="orgb1c2709"></a>

### `reveal.js` as presentation framework

[reveal.js](https://revealjs.com/) 4.x is used as presentation framework.


<a id="org95b0fb7"></a>

### `emacs` with `org-mode`, `org-babel`, `org-re-reveal` for writing/exporting


<a id="orgaec135a"></a>

### `Docker` for transforming `org` to `html`


<a id="orga6114b0"></a>

## Build targets


<a id="org60825c6"></a>

# Building this document

[BUILD.md](BUILD.md) is generated by exporting [BUILD.org](BUILD.md) via `C-c C-e g g` (via `org-gfm-export-to-markdown` from [ox-gfm](https://github.com/larstvei/ox-gfm)).


<a id="orgfdb27b5"></a>

# Building `gulpfile.js`

`gulpfile.js` is generated by *tangling* BUILD.org via [org-babel](https://orgmode.org/manual/Extracting-Source-Code.html). The export can be manually triggered by calling `org-babel-tangle` (`C-c C-v C-t`) from within emacs.

A lot of the behavior is driven by the configuration in [package.json](../package.json). The configuration is located under `cfg`:

```json
// jq ".cfg" package.json
{
  "paths": {
    "src": {
      "base": "./src/",
      "css": "./src/css/",
      "json": "./src/json/",
      "js": "./src/js/",
      "img": "./src/img/",
      "scss": "./src/scss/"
    },
    "dist": {
      "base": "./public/",
      "css": "./public/css/",
      "js": "./public/js/",
      "fonts": "./public/fonts/",
      "img": "./public/img/"
    },
    "build": {
      "base": "./build/",
      "css": "./build/css/",
      "fonts": "./build/fonts/",
      "js": "./build/js/",
      "html": "./build/html/",
      "img": "./build/img/"
    },
    "include": {
      "scssIncludePaths": []
    }
  },
  "vars": {
    "distZip": "git-from-the-inside.zip",
    "licenses": "licenses.txt",
    "build_org_docker": "xuxxux/org-re-reveal-builder:0.1",
    "build_org_docker_local": "build-org"
  }
}
```


<a id="org84e9a5c"></a>

## Red Tape

Red tape to set up `gulp`.


<a id="org311d475"></a>

### Make package.json available

```javascript
const pkg = require('./package.json')
```


<a id="org2a2916a"></a>

### Setup plugins for gulpfile

Most plugins are scoped under `$` to (a) make clear what is provided by a plugin and (b) prepare for automatically generating `$` from `package.json`.

```javascript
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
```


<a id="org9a86263"></a>

### Configure Plugins

Default values for the server started by [watch](#orgf73245a):

```javascript
const root = $.yargs.argv.root || pkg.cfg.paths.dist.base // .cfg.paths.dist.base := "./public/"
const port = $.yargs.argv.port || 8000
```

Banner prefixed to my scripts:

```javascript
const banner = `/*!
 * ${pkg.name}  ${pkg.version}
 * ${pkg.homepage}
 * ${pkg.license}
 *
 * ${pkg.copyright} ${pkg.author.name}, ${pkg.author.web}
*/
`
```

Prevent warnings from opening too many test pages:

```javascript
process.setMaxListeners(20)
```


<a id="org3b4af54"></a>

## Custom Functions

`string_src` generates a virtual file `filename` with `string` as content. ([Source](https://stackoverflow.com/questions/23230569/how-do-you-create-a-file-from-a-string-in-gulp))

```javascript
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
```


<a id="org9c44df1"></a>

## Folders


<a id="org5199f76"></a>

### src/

```javascript
/*
 * Scripts to get things from src to build.
 */
```

1.  src/

    Copy all files into the build directory.
    
    ```javascript
    function src_root_to_build() {
      $.log(`-> Copy all files from ${pkg.cfg.paths.src.base} to ${pkg.cfg.paths.build.base}`)
    
      return src(pkg.cfg.paths.src.base + '*', { nodir: true }) // .cfg.paths.src.base := "./src/"
        .pipe(dest(pkg.cfg.paths.build.base))  // .cfg.paths.build.base := "./build/"
    }
    ```

2.  src/img/

    Copy all images into the build directory.
    
    ```javascript
    function src_img_to_build() {
      $.log(`-> Copy img from ${pkg.cfg.paths.src.img} to ${pkg.cfg.paths.build.img}`)
    
      return src(pkg.cfg.paths.src.img + '**/*.{png,jpg,jpeg,gif,svg}') // .cfg.paths.src.img := "./src/img/"
        .pipe(dest(pkg.cfg.paths.build.img))                            // .cfg.paths.build.img := "./build/img/"
    }
    ```

3.  src/js/

    JavaScript will be linted, prefixed with a banner and then copied into the build directory.
    
    ```javascript
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
    ```

4.  src/css/

    ```javascript
    function src_css_to_build() {
      $.log("-> Copy css to build")
    
      return src(pkg.cfg.paths.src.css + '**/*.css') // .cfg.paths.src.css := "./src/css/"
            .pipe($.sourcemaps.init({loadMaps: true}))
            .pipe($.autoprefixer())
            .pipe($.sourcemaps.write("./"))
            .pipe(dest(pkg.cfg.paths.build.css))     // .cfg.paths.build.css := "./build/css/"
    }
    ```

5.  src/scss/

    ```javascript
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
    ```

6.  Combined rules for `src/`

    ```javascript
    function src_to_build_compose() {
      return parallel(src_root_to_build,
                          src_img_to_build,
                          src_js_to_build_compose(),
                          src_css_to_build,
                          src_scss_to_build)
    }
    // Enable for debugging: exports.src_to_build = src_to_build_compose()
    ```


<a id="org78ccb83"></a>

### node\_modules/

1.  reveal.js

    ```javascript
    function node_modules_reveal_js_to_build() {
      const dst = pkg.cfg.paths.build.js + 'reveal.js'
      $.log(`-> Copy reveal.js to ${dst}`)
    
      return src(["node_modules/reveal.js/**/*"])
            .pipe(dest(dst))
    
    }
    ```

2.  d3 and extensions

    Install d3 and d3-graphviz.
    
    1.  hpcc-js/wasm
    
        `@hpcc-js/wasm` is required by [d3-graphviz](https://github.com/magjac/d3-graphviz). The folder needs to be copied as-is because the `.wasm` files are dynamically loaded.
        
        ```javascript
        function node_modules_hpcc_js_to_build() {
          const dst = pkg.cfg.paths.build.js + '@hpcc-js/wasm/dist'
          $.log(`-> Copy @hpcc-js/wasm to ${dst}`)
        
          return src(["node_modules/@hpcc-js/wasm/dist/**/*"])
                .pipe(dest(dst))
        }
        ```
    
    2.  d3
    
        ```javascript
        function node_modules_d3_to_build() {
          const dst = pkg.cfg.paths.build.js
          $.log(`-> Copy d3 to ${dst}`)
        
          return src(["node_modules/d3/dist/d3.min.js"])
                .pipe(dest(dst))
        }
        ```
    
    3.  d3-graphviz
    
        ```javascript
        function node_modules_d3_graphviz_to_build() {
          const dst = pkg.cfg.paths.build.js
          $.log(`-> Copy d3-graphviz to ${dst}`)
        
          return src(["node_modules/d3-graphviz/build/d3-graphviz.js"])
                .pipe(dest(dst))
        }
        ```
    
    4.  d3 composed
    
        ```javascript
        function node_modules_d3_to_build_compose() {
          return parallel(node_modules_hpcc_js_to_build,
                          node_modules_d3_to_build,
                          node_modules_d3_graphviz_to_build)
        }
        ```

3.  mathjax

    ```javascript
    function node_modules_mathjax_to_build() {
      $.log("-> Copy mathjax to build")
    
      return src(["node_modules/mathjax/es5/tex-chtml.js"])
            .pipe(dest(pkg.cfg.paths.build.js))
    }
    ```

4.  Combined rules for `node_modules/`

    ```javascript
    function node_modules_to_build_compose() {
      return parallel(node_modules_reveal_js_to_build,
                      node_modules_d3_to_build_compose(),
                      node_modules_mathjax_to_build)
    }
    // Enable for debugging: exports.node_modules_to_build = node_modules_to_build_compose()
    ```


<a id="org293d8f8"></a>

### build/

1.  Populate Build (combined)

    ```javascript
    function build_prepare_build_compose() {
        return parallel(node_modules_to_build_compose(),
                        src_to_build_compose())
    }
    exports.prepare_build = build_prepare_build_compose()
    ```

2.  Build index.org

    TODO: This has still some issues
    
    -   `gulp -T` shows it as `<anonymous>`
    -   The resulting files are owned by root
    
    ```javascript
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
    ```

3.  Complete Build

    ```javascript
    exports.finish_build = series(build_prepare_build_compose(),
                               build_org_file_with_docker_compose())
    ```


<a id="orgd2408e5"></a>

### public/

1.  Create licenses

    Gather all node licensed and put them in the `public/` directory. Licenses used only during build are not included.
    
    ```javascript
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
    ```

2.  Fill `public/`

    ```javascript
    function public_copy_from_build() {
      return src(pkg.cfg.paths.build.base)
            .pipe($.filter(["**/*", "!*.tmp"]))
            .pipe(dest(pkg.cfg.paths.dist.base))
    }
    exports.publish = series(exports.finish_build,
                             parallel(public_copy_from_build,
                                      build_gather_node_modules_licenses))
    ```
