- [Overview](#orgc94981c)
  - [Design decisions](#orga054b92)
  - [Directory layout](#orga28d23f)
    - [Flow between folders](#org212037d)
  - [Configuration in `packages.json`](#orgef3ff2d)
  - [Edit the presentation](#orgbb51186)
  - [Build and publish](#orgdc4ca71)
    - [`gulp default` - build `public/`](#org4ef12c4)
    - [`gulp serve` - development webserver with watch](#org0cdb81e)
    - [`gulp package` - create a ZIP](#org463d9bf)
  - [Required tools](#org92f2e69)
- [Details](#org3fd677b)
  - [Tools used](#orgd1bb9ec)
    - [`gulp` for building](#orgbe51a82)
    - [`reveal.js` as presentation framework](#org340690e)
    - [`emacs` with `org-mode`, `org-babel`, `org-re-reveal` for writing/exporting](#org613ea8f)
    - [`Docker` for transforming `org` to `html`](#orgf6d7881)
  - [Build targets](#org08fc3da)
- [Building this document](#org006c698)
- [Building `gulpfile.js`](#orgf62e659)
  - [Red Tape](#org5831adc)
    - [Make package.json available](#org5e5a307)
    - [Setup plugins for gulpfile](#orgf69b283)
    - [Configure Plugins](#orgbeba00d)
  - [Custom Functions](#orgda96724)
  - [Folders](#org299c6d2)
    - [src/](#orgd7518ff)
    - [node\_modules/](#orgc955ba8)
    - [build/](#orgcd86bea)
    - [public/](#orgbd378b4)
  - [Utility Functions](#orgced81a5)
    - [serve](#org4a59069)



<a id="orgc94981c"></a>

# Overview


<a id="orga054b92"></a>

## Design decisions

The whole process serves the simple matter of *creating a presentation*. That means neither bandwitdh nor page load speed are a primary consideration.

These are the primary design goals, from more general to more specific:

-   **Get the Job Done:** In the end the result in `public/` matters.
-   **Ease of Use:** The whole process must be easy to use with a [minimum set of required tools](#org92f2e69).
-   **Automated Build:** The whole process needs to be automated.
-   **Support for `org-mode`:** This was the trigger. I wanted to use [emacs](https://www.gnu.org/software/emacs/) with [org-mode](https://orgmode.org/), [org-babel](https://orgmode.org/worg/org-contrib/babel/), and [org-re-reveal](https://gitlab.com/oer/org-re-reveal) for writing slides.
-   **Reuseable:** The whole system should be reusable across multiple presentations. *Ideally* a new presentation just needs some bootstrap (repository) and *content*.
-   **One Pipeline Per File:** Each file *should* only be modified (e.g. minify) in exactly *one* pipeline. Changing files in multiple pipelines makes it difficult to figure out *where* things happen.
-   **Configuration in [package.json](../package.json):** Ideally (see *Reuseable*) a new presentation only needs changes in [package.json](../package.json) and [index.org](../src/index.md).


<a id="orga28d23f"></a>

## Directory layout

The directory layout is quite simple: Files are moved from `{src, node_modules}` to `build`. In `build` files are generated (e.g. `.org` &#x2013;> `.html`) and then copied to `public`.

-   **node\_modules/:** [Modules](../package.json) installed via [npm](https://www.npmjs.com/). Copied to `build/js` via specific targets. TODO targets.
-   **src/:** Source files (*read-only* during build)
    -   **.:** files that will end up in `build/` via copy. [index.org](../src/index.md) is located here. TARGET TODO
    -   **img/:** images, will be copied to `build/img/.`. TARGETxxx TODO
    -   **js/:** JavaScript files, will be copied (and potentially minified & uglified) to `build/js`. TARGETxxx TODO
    -   **css/:** CSS files, will be copied (and potentially minified) to `build/css`. TARGETxxx TODO
    -   **scss/:** [SCSS](https://sass-lang.com/documentation/syntax) files, will be run through [Sass](https://sass-lang.com/) and copied (and potentially minified) to `build/css`. TARGETxxx TODO
-   **build/:** *Not in version control*. Root folder for all build related activities. E.g. the [building of index.org](#orgdc4ca71) happens in here.
    -   **.:** files that will end up in `public/` via copy. Before that, files will be transformed, e.g. by creating `index.html` by running [index.org](../src/index.md). TARGET TODO
    -   **img/:** images, will be copied to `public/img/.`. TARGETxxx TODO
    -   **js/:** JavaScript files, will be copied to `public/js`. No further minification/uglification. TARGETxxx TODO
    -   **css/:** CSS files, will be copied (and potentially minified) to `public/css`. TARGETxxx TODO
-   **public/:** The final build result.
    -   **.:** Can be served via [`gulp serve`](#org0cdb81e) and packaged as a ZIP via [`gulp package`](#org463d9bf).
    -   **img/:** images
    -   **js/:** JavaScript files
    -   **css/:** CSS files


<a id="org212037d"></a>

### Flow between folders

![img](img/flow-between-folders.png)


<a id="orgef3ff2d"></a>

## Configuration in `packages.json`


<a id="orgbb51186"></a>

## Edit the presentation

The whole presentation is contained in <../src/index.md> and build via org-mode.


<a id="orgdc4ca71"></a>

## Build and publish

The final version will be published into the `public/` directory. Calling `gulp` (or `gulp default`) will build the whole presentation.

**It is important that the presentation is viewed via http(s)** since some JS libraries will not correctly work when served via the file system. [`gulp serve`](#org0cdb81e) starts a small webserver for that.


<a id="org4ef12c4"></a>

### `gulp default` - build `public/`

`gulp` or `gulp default` will update `public/` to the latest result.


<a id="org0cdb81e"></a>

### `gulp serve` - development webserver with watch

`gulp serve` will start a small webserver to view the results (via [gulp-serve](https://www.npmjs.com/package/gulp-serve)).


<a id="org463d9bf"></a>

### `gulp package` - create a ZIP

`gulp package` will create a ZIP file of `public/**/*`.


<a id="org92f2e69"></a>

## Required tools

-   **gulp:** Gulp is used for orchestrating the build
-   **Docker:** [index.org](../src/index.md) is compiled to html via [xuxxux/org-re-reveal-builder](https://hub.docker.com/repository/docker/xuxxux/org-re-reveal-builder) ([Dockerfile](../docker/Dockerfile))


<a id="org3fd677b"></a>

# Details


<a id="orgd1bb9ec"></a>

## Tools used


<a id="orgbe51a82"></a>

### `gulp` for building

The build is automated via [gulp](https://gulpjs.com/docs/en/getting-started/quick-start/). The configuration is done via the [gulpfile.js](../gulpfile.js) and NPMs [package.json](../package.json).

-   **gulpfile.json:** Contains the workflow. The goal is to keep the gulpfile static for a lot of projects.
-   **package.json:** Configures dependencies for build (`--save-dev`), runtime (`--save-prod`) and configuration like paths, urls, globs.


<a id="org340690e"></a>

### `reveal.js` as presentation framework

[reveal.js](https://revealjs.com/) 4.x is used as presentation framework.


<a id="org613ea8f"></a>

### `emacs` with `org-mode`, `org-babel`, `org-re-reveal` for writing/exporting


<a id="orgf6d7881"></a>

### `Docker` for transforming `org` to `html`


<a id="org08fc3da"></a>

## Build targets


<a id="org006c698"></a>

# Building this document

[BUILD.md](BUILD.md) is generated by exporting [BUILD.org](BUILD.md) via `C-c C-e g g` (via `org-gfm-export-to-markdown` from [ox-gfm](https://github.com/larstvei/ox-gfm)).


<a id="orgf62e659"></a>

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


<a id="org5831adc"></a>

## Red Tape

Red tape to set up `gulp`.


<a id="org5e5a307"></a>

### Make package.json available

```javascript
const pkg = require('./package.json')
```


<a id="orgf69b283"></a>

### Setup plugins for gulpfile

Most plugins are scoped under `$` to (a) make clear what is provided by a plugin and (b) prepare for automatically generating `$` from `package.json`.

```javascript
const { series, parallel } = require('gulp')
const { src, dest } = require('gulp')
const { watch } = require('gulp');

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
    child_process : require('child_process').exec,
    fs   : require('fs'),
    log   : require('fancy-log'),
    sourcemaps   : require('gulp-sourcemaps')
}
```


<a id="orgbeba00d"></a>

### Configure Plugins

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


<a id="orgda96724"></a>

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


<a id="org299c6d2"></a>

## Folders


<a id="orgd7518ff"></a>

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


<a id="orgc955ba8"></a>

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


<a id="orgcd86bea"></a>

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
    
    -   The resulting files are owned by root
    
    ```javascript
    function build_org_file_with_docker()
    {
        const docker_image = pkg.cfg.vars.build_org_docker_local
        const build_dir = path.join(__dirname, pkg.cfg.paths.build.base)
    
        $.log(`-> Configured docker container: ${docker_image}. Sources from ${build_dir}`)
        const docker_cmd = `docker run --rm -v "${build_dir}":/tmp/build  "${docker_image}"  /root/convert-to-html.sh /tmp/build`
    
        $.log(docker_cmd)
        var exec = require('child_process').exec;
    
        return exec(docker_cmd, (err, stdout, stderr) =>
            {
                if (err) {
                  $.log.error(stderr)
                }
            })
    }
    exports.build_org_file_with_docker = build_org_file_with_docker
    ```

3.  Complete Build

    ```javascript
    exports.finish_build = series(build_prepare_build_compose(),
                               build_org_file_with_docker)
    ```


<a id="orgbd378b4"></a>

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
      return src(pkg.cfg.paths.build.base + "**/*")
            .pipe($.filter(["**/*", "!*.tmp"]))
            .pipe(dest(pkg.cfg.paths.dist.base))
    }
    exports.publish = series(exports.finish_build,
                             parallel(public_copy_from_build,
                                      build_gather_node_modules_licenses))
    ```


<a id="orgced81a5"></a>

## Utility Functions


<a id="org4a59069"></a>

### serve

Default values for the server started by [serve](#org4a59069):

```javascript
const root = $.yargs.argv.root || pkg.cfg.paths.dist.base // .cfg.paths.dist.base := "./public/"
const port = $.yargs.argv.port || 8000
```

```javascript
async function reload() {
    // FIXME: not working
    $.connect.reload()
}
```

`gulp serve` automatically reloads on changes to the `.org` file.

```javascript
function serve() {
    $.connect.server({
        root: root,
        port: port,
        host: '0.0.0.0',
        livereload: true
    })

    $.log(`Watching ${[pkg.cfg.paths.src.base + '*.org']} ...`)
    watch(pkg.cfg.paths.src.base + '*.org',
            series(src_root_to_build,
                   build_org_file_with_docker,
                   public_copy_from_build,
                   reload
                  ))
    //, ))

    // $.watch([pkg.paths.src.js + '**'], series('js', 'reload', 'test'))

    // $.watch(['plugin/**/plugin.js'], series('reload'))

    // $.watch([
    //     'css/theme/source/*.{sass,scss}',
    //     'css/theme/template/*.{sass,scss}',
    // ], series('css-themes', 'reload'))

    // $.watch([
    //     pkg.paths.src.css + '**/*.scss',
    //     pkg.paths.src.css + '**/*.css'
    // ], series('css-core', 'reload'))

    // $.watch(['test/*.html'], series('test'))
}
exports.serve = serve
```
