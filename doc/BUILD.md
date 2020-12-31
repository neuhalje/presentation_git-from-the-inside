- [Overview](#org4e19e08)
  - [Important targets](#orgda29f7c)
    - [`gulp publish` - build `public/`](#org239b771)
    - [`gulp serve` - development webserver with watch](#org9f745a8)
    - [`gulp package` - create a ZIP](#orgabeb464)
    - [`gulp clean` - clean `build/` and `public/`](#orgc2c2d8f)
    - [`gulp help`](#orgd835341)
    - [`gulp daily-work`](#org6df7600)
  - [Design decisions](#org99eb311)
  - [Directory layout](#orga225465)
    - [Flow between folders](#orgd750175)
  - [Configuration in `packages.json`](#org68e9d27)
  - [Edit the presentation](#org0b443a5)
  - [Required tools for building](#org1af53be)
  - [Tools used by the author](#org9c856c1)
    - [`gulp` for building](#orgb51e9a6)
    - [`reveal.js` as presentation framework](#org2c1afe8)
    - [`emacs` with `org-mode`, `org-babel`, `org-re-reveal` for writing/exporting](#org8a650a1)
    - [`Docker` for transforming `org` to `html`](#org0244bc4)
- [Building this document](#org9b22d15)
- [Building `gulpfile.js`](#orgb75db2c)
  - [Red Tape](#orgeeba8a8)
    - [Make package.json available](#org6dedcae)
    - [Setup plugins for gulpfile](#orgc81f6bd)
    - [Configure Plugins](#org5cab75e)
  - [Custom Functions](#orgbf26c24)
  - [Folders](#orgddd4778)
    - [node\_modules/](#org69fc99d)
    - [src/](#orgb8d8cab)
    - [build/](#org9bc08f4)
    - [public/](#org1e80baf)
  - [Utility Functions](#orgf32e413)
    - [serve](#orga339893)
    - [clean](#orgbcb60d8)
    - [package](#org45a6e4f)
    - [day-to-day working](#org735c274)
    - [default](#org8aab7f4)
    - [Playground](#org9cddf0d)



<a id="org4e19e08"></a>

# Overview

This (rather lengthy) file describes the build process and is used to generate the [gulpfile](../gulpfile.js).

The task of the build process is the transformation of `index.org` to a [reveal.js](https://revealjs.com/) presentation.


<a id="orgda29f7c"></a>

## Important targets

Calling `gulp` (or `gulp default`) will build the whole presentation. The final version will be published into the `public/` directory.

**It is important that the presentation is viewed via http(s)** since some JS libraries will not work correctly when served via the file system. The task [`gulp serve`](#org9f745a8) starts a small webserver for that.


<a id="org239b771"></a>

### `gulp publish` - build `public/`

`gulp` or `gulp publish` will update `public/` to the latest result (see [here](#org8a6ebd6)).

[`gulp clean`](#orgc2c2d8f) is **not** called as a part of publish.

    # Serve rebuild the presentation and serve it via a local http server
    gulp clean publish serve --series

1.  Options

    -   **docker-image:** The docker image to use to convert `index.org` into `index.html`.


<a id="org9f745a8"></a>

### `gulp serve` - development webserver with watch

`gulp serve` will start a small webserver to view the results (via [gulp-serve](https://www.npmjs.com/package/gulp-serve)).

1.  Options

    To override the port/path use `--port` and `--root`:
    
        # Serve /tmp via port 9999
        gulp serve --port 9999 --root /tmp
    
    Changes to `index.org` will be detected and automatically build & deployed to `public/`. `gulp serve` will *not* do the initial build.
    
        # A good way to start the day
        gulp clean publish serve --series
    
    The task is defined [here](#orga339893).


<a id="orgabeb464"></a>

### `gulp package` - create a ZIP

`gulp package` will create a ZIP file of `public/**/*`.

The task is defined [here](#org45a6e4f).


<a id="orgc2c2d8f"></a>

### `gulp clean` - clean `build/` and `public/`

`gulp clean` will delete all build outputs.

The task is defined [here](#orgbcb60d8).


<a id="orgd835341"></a>

### `gulp help`

Shows the options for the gulpfile:

    gulp help


<a id="org6df7600"></a>

### `gulp daily-work`

Wraps up `clean`, `publish` and `serve`.


<a id="org99eb311"></a>

## Design decisions

The whole process serves the simple matter of *creating a presentation*. That means neither bandwitdh nor page load speed are a primary consideration.

These are the primary design goals, from more general to more specific:

-   **Get the Job Done:** In the end the result in `public/` matters.
-   **Ease of Use:** The whole process must be easy to use with a [minimum set of required tools](#org1af53be).
-   **Automated Build:** The whole process needs to be automated.
-   **Support for `org-mode`:** This was the trigger. I wanted to use [emacs](https://www.gnu.org/software/emacs/) with [org-mode](https://orgmode.org/), [org-babel](https://orgmode.org/worg/org-contrib/babel/), and [org-re-reveal](https://gitlab.com/oer/org-re-reveal) for writing slides.
-   **Reuseable:** The whole system should be reusable across multiple presentations. *Ideally* a new presentation just needs some bootstrap (repository) and *content*.
-   **One Pipeline Per File:** Each file *should* only be modified (e.g. minify) in exactly *one* pipeline. Changing files in multiple pipelines makes it difficult to figure out *where* things happen.
-   **Configuration in [package.json](../package.json):** Ideally (see *Reuseable*) a new presentation only needs changes in [package.json](../package.json) and [index.org](../src/index.md).


<a id="orga225465"></a>

## Directory layout

The directory layout is quite simple: Files are moved from `{src, node_modules}` to `build`. In `build` files are generated (e.g. `.org` &#x2013;> `.html`) and then copied to `public`.

-   **node\_modules/:** [Modules](../package.json) installed via [npm](https://www.npmjs.com/). Copied to `build/js` via specific targets. (see [node\_modules/](#org69fc99d))
-   **src/:** Source files (*read-only* during build)
    -   **.:** files that will end up in `build/` via copy. `index.org` is located here. (see[src/](#orgb8d8cab))
    -   **img/:** images, will be copied to `build/img/.`. ([src/img/](#orgf8abc12))
    -   **js/:** JavaScript files, will be copied (and potentially minified & uglified) to `build/js`. ([src/js/](#orgfe31b12))
    -   **css/:** CSS files, will be copied (and potentially minified) to `build/css`. ([src/css/](#org1be969d))
    -   **scss/:** [SCSS](https://sass-lang.com/documentation/syntax) files, will be run through [Sass](https://sass-lang.com/) and copied (and potentially minified) to `build/css`. ([src/scss/](#org5588ed8))
-   **build/:** *Not in version control*. Root folder for all build related activities. E.g. the [building of index.org](#orgda29f7c) happens in here. ([build/](#org9bc08f4)). Later copied to `public/` by [Fill `public/`](#org8a6ebd6).
    -   **.:** files that will end up in `public/` via copy. Before that, files will be transformed, e.g. by creating `index.html` by running [index.org](../src/index.md). ([Build index.org](#orgd4cb846))
    -   **img/:** images, will be copied to `public/img/.`
    -   **js/:** JavaScript files, will be copied to `public/js`. No further minification/uglification.
    -   **css/:** CSS files, will be copied (and potentially minified) to `public/css`.
-   **public/:** The final build result.
    -   **.:** Can be served via [`gulp serve`](#org9f745a8) and packaged as a ZIP via [`gulp package`](#orgabeb464).
    -   **img/:** images
    -   **js/:** JavaScript files
    -   **css/:** CSS files


<a id="orgd750175"></a>

### TODO Flow between folders


<a id="org68e9d27"></a>

## TODO Configuration in `packages.json`


<a id="org0b443a5"></a>

## Edit the presentation

The whole presentation is contained in <../src/index.md> and build via org-mode.


<a id="org1af53be"></a>

## Required tools for building

-   **gulp:** Gulp is used for orchestrating the build
-   **Docker:** [index.org](../src/index.md) is compiled to html via [xuxxux/org-re-reveal-builder](https://hub.docker.com/repository/docker/xuxxux/org-re-reveal-builder) ([Dockerfile](../docker/Dockerfile))


<a id="org9c856c1"></a>

## Tools used by the author


<a id="orgb51e9a6"></a>

### `gulp` for building

The build is automated via [gulp](https://gulpjs.com/docs/en/getting-started/quick-start/). The configuration is done via the [gulpfile.js](../gulpfile.js) and NPMs [package.json](../package.json).

-   **gulpfile.json:** Contains the workflow. The goal is to keep the gulpfile static for a lot of projects.
-   **package.json:** Configures dependencies for build (`--save-dev`), runtime (`--save-prod`) and configuration like paths, urls, globs.


<a id="org2c1afe8"></a>

### `reveal.js` as presentation framework

[reveal.js](https://revealjs.com/) 4.x is used as presentation framework.


<a id="org8a650a1"></a>

### `emacs` with `org-mode`, `org-babel`, `org-re-reveal` for writing/exporting


<a id="org0244bc4"></a>

### `Docker` for transforming `org` to `html`


<a id="org9b22d15"></a>

# Building this document

[BUILD.md](BUILD.md) is generated by exporting [BUILD.org](BUILD.md) via `C-c C-e g g` (via `org-gfm-export-to-markdown` from [ox-gfm](https://github.com/larstvei/ox-gfm)).


<a id="orgb75db2c"></a>

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
    "build": {
      "base": "./build/",
      "css": "./build/css/",
      "fonts": "./build/fonts/",
      "js": "./build/js/",
      "html": "./build/html/",
      "img": "./build/img/"
    },
    "dist": {
      "base": "./public/",
      "css": "./public/css/",
      "js": "./public/js/",
      "fonts": "./public/fonts/",
      "img": "./public/img/"
    },
    "include": {
      "scssIncludePaths": [
        "./node_modules/reveal.js/css/theme"
      ]
    }
  },
  "favicon": {
    "src": "./src/img/favicon_src.png",
    "dest": "./build/img/site/",
    "path": "/img/site/",
    "background": "#464140"
  },
  "vars": {
    "distZip": "git-from-the-inside.zip",
    "licenses": "licenses.txt",
    "build_org_docker": "xuxxux/org-re-reveal-builder:0.2",
    "build_org_docker_local": "build-org",
    "build_org_docker_build_command": "/emacs/convert-to-html.sh /tmp/build",
    "serve": {
      "port": 8000,
      "host": "127.0.0.1"
    }
  },
  "filter": {
    "publishThese": [
      "**/*",
      "!**/*.tmp",
      "!**/*.org",
      "!**/#*",
      "!**/*.tmp",
      "!**/*.inc"
    ]
  }
}
```


<a id="orgeeba8a8"></a>

## Red Tape

Red tape to set up `gulp`.


<a id="org6dedcae"></a>

### Make package.json available

```javascript
const pkg = require('./package.json')
```


<a id="orgc81f6bd"></a>

### Setup plugins for gulpfile

Most plugins are scoped under `$` to (a) make clear what is provided by a plugin and (b) prepare for automatically generating `$` from `package.json`.

```javascript
const { series, parallel } = require('gulp')
const { src, dest } = require('gulp')
const { watch } = require('gulp');
const gulp = require('gulp');

const { rollup } = require('rollup')
const { terser } = require('rollup-plugin-terser')

const Vinyl = require('vinyl')

const path = require('path')
const { Readable, Writable } = require('stream');

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
    sourcemaps   : require('gulp-sourcemaps'),
    del : require('del'),
    favicons : require('favicons').stream,
    notify : require("gulp-notify"),
    notifier : require('node-notifier')

}
```


<a id="org5cab75e"></a>

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

Configure command line flags via yargs:

```javascript
// CLI arguments
const args = $.yargs.options({
    'root': {
        demandOption: true,
        default: pkg.cfg.paths.dist.base,
        describe: 'serve: Directory to be served via http. Default from package.json: cfg.paths.dist.base',
        type: 'string'
      },
    'host': {
        demandOption: true,
        default: pkg.cfg.vars.serve.host || '127.0.0.1',
        describe: 'serve: Address to bind to (e.g. localhost, 127.0.0.1 or 0.0.0.0). Configure in package.json: cfg.vars.serve.host',
        type: 'string'
    },
    'port': {
        demandOption: true,
        default: pkg.cfg.vars.serve.port || 8000,
        describe: 'serve: Port to listen on. Configure in package.json: cfg.vars.serve.port',
        type: 'string'
    },
    'docker_image': {
        alias: 'docker-image',
        demandOption: true,
        default:  pkg.cfg.vars.build_org_docker_local ||  pkg.cfg.vars.build_org_docker,
        describe: 'publish: Docker image used to convert org->html. Default taken from cfg.vars.build_org_docker (for local dev you can override this in pkg.cfg.vars.build_org_docker_local).',
        type: 'string'
    },
    'build_command' : {
        alias: 'docker-build-command',
        demandOption: true,
        default:  pkg.cfg.vars.build_org_docker_build_command,
        describe: 'publish: Command executed in the docker container.',
        type: 'string'
    }

})
const argv = args.argv
```


<a id="orgbf26c24"></a>

## Custom Functions

`string_src` generates a virtual file `filename` with `string` as content. ([Source](https://stackoverflow.com/questions/23230569/how-do-you-create-a-file-from-a-string-in-gulp))

```javascript
/*
 * Create a stream useable in =src=. The stream contains
 * one file named =filename= with the content =content=.
 */
function string_src(filename, content) {
  return new Readable({
    objectMode: true,
    read() {
        this.push(new Vinyl({
        cwd: '',
        base: null,
        path: filename,
        contents: Buffer.from(content)
        }))
        this.push(null)
    }
  })
}
```


<a id="orgddd4778"></a>

## Folders


<a id="org69fc99d"></a>

### node\_modules/

```javascript
/*
 * Scripts to get things from node_modules to build.
 */
```

1.  reveal.js

    ```javascript
    function node_modules_reveal_js_to_build() {
      const dst = pkg.cfg.paths.build.js + 'reveal.js'
      $.log(`-> Copy reveal.js to ${dst}`)
    
      return src(["node_modules/reveal.js/**/*"])
            .pipe(dest(dst))
    
    }
    
    node_modules_reveal_js_to_build.displayName = "Reveal.js to build"
    node_modules_reveal_js_to_build.description = `Copy reveal.js from node_modules to ${pkg.cfg.paths.build.base}.`
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
        
        node_modules_hpcc_js_to_build.displayName = "@hpcc-js/wasm to build"
        node_modules_hpcc_js_to_build.description = "Copy @hpcc-js/wasm to build."
        ```
    
    2.  d3
    
        ```javascript
        function node_modules_d3_to_build() {
          const dst = pkg.cfg.paths.build.js
          $.log(`-> Copy d3 to ${dst}`)
        
          return src(["node_modules/d3/dist/d3.min.js"])
                .pipe(dest(dst))
        }
        node_modules_d3_to_build.displayName = "d3 to build"
        node_modules_d3_to_build.description = "Copy d3to build."
        ```
    
    3.  d3-graphviz
    
        ```javascript
        function node_modules_d3_graphviz_to_build() {
          const dst = pkg.cfg.paths.build.js
          $.log(`-> Copy d3-graphviz to ${dst}`)
        
          return src(["node_modules/d3-graphviz/build/d3-graphviz.js"])
                .pipe(dest(dst))
        }
        node_modules_d3_graphviz_to_build.displayName = "d3-graphviz to build"
        node_modules_d3_graphviz_to_build.description = "Copy d3-graphviz to build."
        ```
    
    4.  d3 composed
    
        ```javascript
        function node_modules_d3_to_build_compose() {
          return parallel(node_modules_hpcc_js_to_build,
                          node_modules_d3_to_build,
                          node_modules_d3_graphviz_to_build)
        }
        node_modules_d3_to_build_compose.displayName = "d3 & tools to build"
        node_modules_d3_to_build_compose.description = "Copy d3 & tools from node_modules to build."
        ```

3.  mathjax

    ```javascript
    function node_modules_mathjax_to_build() {
      $.log("-> Copy mathjaxto build.")
    
      return src(["node_modules/mathjax/es5/tex-chtml.js"])
            .pipe(dest(pkg.cfg.paths.build.js))
    }
    node_modules_mathjax_to_build.displayName = "mathjax to build"
    node_modules_mathjax_to_build.description = "Copy mathjax from node_modules to build."
    ```

4.  Combined rules for `node_modules/`

    ```javascript
    function node_modules_to_build_compose() {
      return parallel(node_modules_reveal_js_to_build,
                      node_modules_d3_to_build_compose(),
                      node_modules_mathjax_to_build)
    }
    node_modules_to_build_compose.displayName = "node_modules to build"
    node_modules_to_build_compose.description = "Copy all libraries from node_modules to build."
    // Enable for debugging: exports.node_modules_to_build = node_modules_to_build_compose()
    ```


<a id="orgb8d8cab"></a>

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
    src_root_to_build.displayName = "Shallow copy base to build"
    src_root_to_build.description = `Shallow copy  ${pkg.cfg.paths.src.base} to build.`
    ```

2.  src/img/

    Copy all images into the build directory.
    
    ```javascript
    function src_img_to_build() {
      $.log(`-> Copy img from ${pkg.cfg.paths.src.img} to ${pkg.cfg.paths.build.img}`)
    
      return src(pkg.cfg.paths.src.img + '**/*.{png,jpg,jpeg,gif,svg}') // .cfg.paths.src.img := "./src/img/"
        .pipe(dest(pkg.cfg.paths.build.img))                            // .cfg.paths.build.img := "./build/img/"
    }
    src_img_to_build.displayName = "img to build"
    src_img_to_build.description = `Copy ${pkg.cfg.paths.src.img} to build.`
    ```

3.  src/js/

    JavaScript will be linted, prefixed with a banner and then copied into the build directory.
    
    ```javascript
    function src_lint_js() {
      $.log(`-> Linting ${[pkg.cfg.paths.src.js + '**/*.js', 'gulpfile.js']}`)
    
      return src([pkg.cfg.paths.src.js + '**/*.js', 'gulpfile.js']) // .cfg.paths.src.js := "./src/js/"
            .pipe($.eslint())
            .pipe($.eslint.format())
    }
    src_lint_js.displayName = "Lint my JS"
    src_lint_js.description = `Lint ${pkg.cfg.paths.src.js}.`
    
    // Use a lambda bc. otherwise gulp would use the functions display name with spaces as target
    exports.lint = () => src_lint_js()
    exports.lint.description = src_lint_js.description
    
    
    function src_copy_js_to_build() {
      return src(pkg.cfg.paths.src.js + '**/*.js') // .cfg.paths.src.js := "./src/js/"
        .pipe($.header(banner))
        .pipe(dest(pkg.cfg.paths.build.js))        // .cfg.paths.build.js := "./build/js/"
    }
    src_copy_js_to_build.displayName = "Copy JS to build"
    src_copy_js_to_build.description = `Copy ${pkg.cfg.paths.src.js} to build and add banner.`
    
    function src_js_to_build_compose() {
      return series(src_lint_js, src_copy_js_to_build)
    }
    src_js_to_build_compose.description = `Lint, copy and banner JS from ${pkg.cfg.paths.src.js} to build.`
    ```

4.  src/css/

    ```javascript
    function src_css_to_build() {
      return src(pkg.cfg.paths.src.css + '**/*.css') // .cfg.paths.src.css := "./src/css/"
            .pipe($.sourcemaps.init({loadMaps: true}))
            .pipe($.autoprefixer())
            .pipe($.sourcemaps.write("./"))
            .pipe(dest(pkg.cfg.paths.build.css))     // .cfg.paths.build.css := "./build/css/"
    }
    src_css_to_build.displayName = "Transform css to build"
    src_css_to_build.description = `Copy ${pkg.cfg.paths.src.css} to build, create sourcemaps and autoprefix.`
    ```

5.  src/scss/

    ```javascript
    function src_scss_to_build() {
      return src(pkg.cfg.paths.src.scss + '**/*.scss') // .cfg.paths.src.scss := "./src/scss/"
            .pipe($.sourcemaps.init({loadMaps: true}))
            .pipe($.sass({includePaths: pkg.cfg.paths.include.scssIncludePaths /* .cfg.paths.include.scssIncludePaths := [ "./node_modules/reveal.js/css/theme" ] */
                })
                .on("error", $.sass.logError))
            .pipe($.autoprefixer())
            .pipe($.sourcemaps.write("./"))
            .pipe(dest(pkg.cfg.paths.build.css))       // .cfg.paths.build.css := "./build/css/"
    }
    src_scss_to_build.displayName = "Transform scss to build"
    src_scss_to_build.description = `Compile ${pkg.cfg.paths.src.scss} to build, create sourcemaps and autoprefix.`
    
    exports.scss =() => src_scss_to_build()
    exports.scss.description = src_scss_to_build.description
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
    // exports.src_to_build = src_to_build_compose()
    // exports.src_to_build.description = "Transform src to build"
    ```

7.  Populate Build (combined src/node\_modules)

    ```javascript
    function build_prepare_build_compose() {
        return parallel(node_modules_to_build_compose(),
                        src_to_build_compose())
    }
    exports.prepare_build = build_prepare_build_compose()
    exports.prepare_build.description = `Prepare ${pkg.cfg.paths.build.base} with node_modules and  ${pkg.cfg.paths.src.base}.`
    ```


<a id="org9bc08f4"></a>

### build/

```javascript
/*
 * Scripts to build things in build.
 */
```

1.  Build index.org

    ```javascript
    function build_org_create_gen_dir(cb) {
       const dir = `${pkg.cfg.paths.build.base}/org-gen`
    
       $.log(`Create ${pkg.cfg.paths.build.base}/org-gen`)
    
       if (! $.fs.existsSync(dir)) {
           $.fs.mkdirSync(dir)
       }
       cb()
    }
    
    build_org_create_gen_dir.displayName = `Create ${pkg.cfg.paths.build.base}/org-gen`
    ```
    
    TODO: This has still some issues
    
    -   [ ] The resulting files are owned by root (needs to be fixed in the Dockerfile)
    -   [ ] Errors halt the process before notifications are shown
    
    ```javascript
    function build_org_file_with_docker()
    {
    
        const userInfo = require('os').userInfo()
    
        const docker_image = argv.docker_image
        const build_dir = path.join(__dirname, pkg.cfg.paths.build.base)
        const build_command = argv.build_command
    
        const docker_cmd = `docker run --rm -v "${build_dir}":/tmp/build --user ${userInfo.uid}:${userInfo.gid} -e HOME="/emacs"  "${docker_image}" ${build_command}`
        const options = {}
    
        $.log(`-> Configured docker container: ${docker_image}. Building files in from ${build_dir}`)
        $.log(`-> Running: ${docker_cmd}`)
    
        const exec = require('child_process').exec
    
        // This is nearly 1:1 from the documentation (https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback).
        // Still the callback is not executed on errors
        return exec(docker_cmd,  options, (err, stdout, stderr) => {
                if (err) {
                  $.log.error(stderr)
                  $.notify.onError("Error building docker <%= error.message =%> with command <%= docker_cmd =%>")
                  throw new Error('kaboom: ' + err)
                } else {
                  $.log.error(stderr)
                  $.notify.onError("Docker done <%= docker_cmd =%>")
            }
            })
    }
    build_org_file_with_docker.displayName = "Transform index.org via Docker"
    build_org_file_with_docker.description = `Build index.org with "${pkg.cfg.vars.build_org_docker_local}" docker container.`
    
    exports.build_org_file_with_docker = series(build_org_create_gen_dir, build_org_file_with_docker)
    exports.build_org_file_with_docker.displayName = "build-org"
    exports.build_org_file_with_docker.description = build_org_file_with_docker.description
    ```

2.  Create licenses

    Gather all node licensed and put them in the `build/` directory. Licenses used only during build are not included.
    
    ```javascript
    function build_gather_node_modules_licenses(cb) {
        const dst = pkg.cfg.paths.build.base
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
    build_gather_node_modules_licenses.displayName = "Gather licenses from node_modules"
    build_gather_node_modules_licenses.description = `Gathering all (potentially distributed) licenes from node_modules to ${pkg.cfg.vars.licenses}`
    ```

3.  Build favicons

    Generate the favicions via [itgalaxy/favicons](https://github.com/itgalaxy/favicons).
    
    ```javascript
    function build_favicons() {
        const source = pkg.cfg.favicon.src
    
        const configuration = {
            appName: pkg.name,                            // Your application's name. `string`
            appShortName: null,                       // Your application's short_name. `string`. Optional. If not set, appName will be used
            appDescription: pkg.description,                     // Your application's description. `string`
            developerName: pkg.author.name,                      // Your (or your developer's) name. `string`
            developerURL: pkg.homepage,                       // Your (or your developer's) URL. `string`
            background: pkg.cfg.favicon.background,
            path: pkg.cfg.favicon.path,
            url: pkg.homepage,
            display: "standalone",
            orientation: "portrait",
            scope: "/",
            start_url: "/",
            version: 1.0,
            logging: false,
            html: "index.html",
            pipeHTML: false,
            replace: true,
            icons: {
                android: false,              // Create Android homescreen icon. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
                appleIcon: false,            // Create Apple touch icons. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
                appleStartup: false,         // Create Apple startup images. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
                coast: false,                // Create Opera Coast icon. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
                favicons: true,             // Create regular favicons. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
                firefox: false,              // Create Firefox OS icons. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
                windows: false,              // Create Windows 8 tile icons. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
                yandex: false                // Create Yandex browser icon. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
            }
        }
    
      return src(source)
            .pipe($.favicons(configuration))
            .on("error", $.log)
            .pipe(dest(pkg.cfg.favicon.dest))
    }
    
    build_favicons.displayName = "Build favicons"
    build_favicons.description = `Derive favicons from ${pkg.cfg.favicon.src}.`
    //exports.favicons = build_favicons
    ```

4.  Complete Build

    ```javascript
    exports.finish_build = parallel(build_gather_node_modules_licenses,
                                    build_favicons,
                                    series(build_prepare_build_compose(),
                                            exports.build_org_file_with_docker))
    
    exports.finish_build.displayName = "build"
    exports.finish_build.description = `Populate and build ${pkg.cfg.paths.build.base}.`
    ```


<a id="org1e80baf"></a>

### public/

```javascript
/*
 * Scripts to get things from build to public.
 */
```

1.  Filter `build/` to `public/`

    Copy over `build/` to `public/`. Filter out temporary files and `org` files.
    
    ```javascript
    function public_copy_from_build() {
      const filter = $.filter(pkg.cfg.filter.publishThese)
      $.log(`Copy ${pkg.cfg.paths.build.base} -> ${pkg.cfg.paths.dist.base} with filter ${pkg.cfg.filter.publishThese}`)
      return src(pkg.cfg.paths.build.base + "**/*")
            .pipe(filter)
            .pipe(dest(pkg.cfg.paths.dist.base))
    }
    public_copy_from_build.displayName = "Copy to build"
    public_copy_from_build.description = `Copy files matching ${pkg.cfg.filter.publishThese} from ${pkg.cfg.paths.build.base} to ${pkg.cfg.paths.dist.base}.`
    
    
    exports.publish = series(exports.finish_build,
                             public_copy_from_build)
    
    exports.publish.description = `Build the project and publish to ${pkg.cfg.paths.dist.base}.`
    ```


<a id="orgf32e413"></a>

## Utility Functions

```javascript
/*
 * Utility functions
 */
```


<a id="orga339893"></a>

### serve

```javascript
async function reload() {
    // FIXME: not working
    $.connect.reload()
    $.notifier.notify({ title: "Build succeeded", message: "Build output updated, please reoad web page."})
}
```

`gulp serve` automatically reloads on changes to the `.org` file.

```javascript
function serve_watch_org() {
    $.log(`Watching ${pkg.cfg.paths.src.base + '*.org'} ...`)
    return watch(pkg.cfg.paths.src.base + '*.org',
            series(src_root_to_build,
                   exports.build_org_file_with_docker,
                   public_copy_from_build,
                   reload
                  ))
}
serve_watch_org.displayName = `Watch ${pkg.cfg.paths.src.base + '*.org'}`
serve_watch_org.description = `Watchi ${pkg.cfg.paths.src.base + '*.org'} and rebuild on change.`

function serve_watch_scss() {
    $.log(`Watching ${pkg.cfg.paths.src.scss + '**/*.scss'} ...`)
    return watch(pkg.cfg.paths.src.scss + '**/*.scss',
            series(src_scss_to_build,
                   public_copy_from_build,
                   reload
                  ))
}
serve_watch_scss.displayName = `Watch ${pkg.cfg.paths.src.scss + '**/*.scss'}`
serve_watch_scss.description = `Watchi ${pkg.cfg.paths.src.scss + '**/*.scss'} and rebuild on change.`



function serve_webserver() {
    $.connect.server({
        root: argv.root,
        port: argv.port,
        host: argv.host,
        livereload: true
    })
}
serve_webserver.displayName =  `Serve ${root} as http://${argv.host}:${argv.port}/.`
serve_webserver.description =  `Serve ${root} as http://${argv.host}:${argv.port}/. Override with --{host,port,root}.`

exports.serve = parallel(serve_webserver, serve_watch_org, serve_watch_scss)
exports.serve.description = `Serve ${argv.root} as http://${argv.host}:${argv.port}/. Override with --{host,port,root}.`
```


<a id="orgbcb60d8"></a>

### clean

Delete `build/` and `public/`.

Since `clean` is a very sharp knife, we take some precautions. Only subfolders will be deleted.

```javascript
function clean() {

  const to_be_deleted = [
      pkg.cfg.paths.build.base,
      pkg.cfg.paths.dist.base
  ]

  for (let candidate of to_be_deleted) {
      if (! candidate.startsWith("./")) {
          const msg=`Will not delete "${candidate}": Configure path in package.json to start with './'`
          $.log.error(msg)
          throw new Error('kaboom: ' + msg)
      }
  }
  return $.del(to_be_deleted)
}

clean.description = `Delete all build outputs (${pkg.cfg.paths.build.base}, ${pkg.cfg.paths.dist.base}).`
exports.clean = clean
```


<a id="org45a6e4f"></a>

### package

Do a fresh build of the presentation and write it into a zip file.

```javascript
function package_public() {
   return src(pkg.cfg.paths.dist.base + "**/*")
                                 .pipe($.zip(pkg.cfg.vars.distZip))
                                 .pipe(dest('./'))
}
package_public.displayName = `Create ${pkg.cfg.vars.distZip}`
package_public.description = `Create ${pkg.cfg.vars.distZip}.`

exports.package = series(exports.clean, exports.publish, package_public)
exports.package.displayName = "package"
exports.package.description = `Build & create ${pkg.cfg.vars.distZip}.`
```


<a id="org735c274"></a>

### day-to-day working

```javascript
exports.daily = series(exports.clean, exports.publish, exports.serve)
exports.daily.displayName = "daily-work"
exports.daily.description = "Mode for hacking away: clean, publish & serve."
```


<a id="org8aab7f4"></a>

### default

```javascript
exports.default = exports.publish
```


<a id="org9cddf0d"></a>

### Playground

This is where new tasks are evaluated &#x2026;

```javascript
async function check_out() {
    $.notifier.notify( {title:'title', message:'message'})
}
 exports.check_out = check_out
```
