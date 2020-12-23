- [Overview](#orgaf92f93)
  - [Important targets](#org8f444a0)
    - [`gulp publish` - build `public/`](#org419ea40)
    - [`gulp serve` - development webserver with watch](#org52979a2)
    - [`gulp package` - create a ZIP](#org8bbcddb)
    - [`gulp clean` - clean `build/` and `public/`](#orgb7929ec)
  - [Design decisions](#org1bc267b)
  - [Directory layout](#org9b76b5a)
    - [Flow between folders](#orgb2b4fe6)
  - [Configuration in `packages.json`](#org58f79f2)
  - [Edit the presentation](#org9287d73)
  - [Required tools for building](#orgdfee428)
  - [Tools used by the author](#org865b348)
    - [`gulp` for building](#orgfe52ea8)
    - [`reveal.js` as presentation framework](#orgeb0b682)
    - [`emacs` with `org-mode`, `org-babel`, `org-re-reveal` for writing/exporting](#orgbe7a539)
    - [`Docker` for transforming `org` to `html`](#orgb240cbd)
- [Building this document](#org07f6752)
- [Building `gulpfile.js`](#org64df198)
  - [Red Tape](#org2e6ba4c)
    - [Make package.json available](#org641fe44)
    - [Setup plugins for gulpfile](#orgf906186)
    - [Configure Plugins](#org37669f6)
  - [Custom Functions](#org167e948)
  - [Folders](#orgfb19050)
    - [node\_modules/](#org799f4bf)
    - [src/](#orge45a96b)
    - [build/](#orgcea4946)
    - [public/](#orgc7b1737)
  - [Utility Functions](#org818e646)
    - [serve](#org8169408)
    - [clean](#org4f21619)
    - [package](#org0e28ad3)



<a id="orgaf92f93"></a>

# Overview

This (rather lengthy) file describes the build process and is used to generate the [gulpfile](../gulpfile.js).

The task of the build process is the transformation of `index.org` to a [reveal.js](https://revealjs.com/) presentation.


<a id="org8f444a0"></a>

## Important targets

Calling `gulp` (or `gulp default`) will build the whole presentation. The final version will be published into the `public/` directory.

**It is important that the presentation is viewed via http(s)** since some JS libraries will not work correctly when served via the file system. The task [`gulp serve`](#org52979a2) starts a small webserver for that.


<a id="org419ea40"></a>

### `gulp publish` - build `public/`

`gulp` or `gulp publish` will update `public/` to the latest result (see [here](#orgbe13aba)).

[`gulp clean`](#orgb7929ec) is **not** called as a part of publish.

    # Serve rebuild the presentation and serve it via a local http server
    gulp clean publish serve


<a id="org52979a2"></a>

### `gulp serve` - development webserver with watch

`gulp serve` will start a small webserver to view the results (via [gulp-serve](https://www.npmjs.com/package/gulp-serve)).

To override the port/path use `--port` and `--root`:

    # Serve /tmp via port 9999
    gulp serve --port 9999 --root /tmp

Changes to `index.org` will be detected and automatically build & deployed to `public/`. `gulp serve` will *not* do the initial build.

    # A good way to start the day
    gulp clean publish serve --series

The task is defined [here](#org8169408).


<a id="org8bbcddb"></a>

### TODO `gulp package` - create a ZIP

`gulp package` will create a ZIP file of `public/**/*`.

The task is defined [here](#org0e28ad3).


<a id="orgb7929ec"></a>

### `gulp clean` - clean `build/` and `public/`

`gulp clean` will delete all build outputs.

The task is defined [here](#org4f21619).


<a id="org1bc267b"></a>

## Design decisions

The whole process serves the simple matter of *creating a presentation*. That means neither bandwitdh nor page load speed are a primary consideration.

These are the primary design goals, from more general to more specific:

-   **Get the Job Done:** In the end the result in `public/` matters.
-   **Ease of Use:** The whole process must be easy to use with a [minimum set of required tools](#orgdfee428).
-   **Automated Build:** The whole process needs to be automated.
-   **Support for `org-mode`:** This was the trigger. I wanted to use [emacs](https://www.gnu.org/software/emacs/) with [org-mode](https://orgmode.org/), [org-babel](https://orgmode.org/worg/org-contrib/babel/), and [org-re-reveal](https://gitlab.com/oer/org-re-reveal) for writing slides.
-   **Reuseable:** The whole system should be reusable across multiple presentations. *Ideally* a new presentation just needs some bootstrap (repository) and *content*.
-   **One Pipeline Per File:** Each file *should* only be modified (e.g. minify) in exactly *one* pipeline. Changing files in multiple pipelines makes it difficult to figure out *where* things happen.
-   **Configuration in [package.json](../package.json):** Ideally (see *Reuseable*) a new presentation only needs changes in [package.json](../package.json) and [index.org](../src/index.md).


<a id="org9b76b5a"></a>

## Directory layout

The directory layout is quite simple: Files are moved from `{src, node_modules}` to `build`. In `build` files are generated (e.g. `.org` &#x2013;> `.html`) and then copied to `public`.

-   **node\_modules/:** [Modules](../package.json) installed via [npm](https://www.npmjs.com/). Copied to `build/js` via specific targets. (see [node\_modules/](#org799f4bf))
-   **src/:** Source files (*read-only* during build)
    -   **.:** files that will end up in `build/` via copy. `index.org` is located here. (see[src/](#orge45a96b))
    -   **img/:** images, will be copied to `build/img/.`. ([src/img/](#orgde26545))
    -   **js/:** JavaScript files, will be copied (and potentially minified & uglified) to `build/js`. ([src/js/](#orgfb10def))
    -   **css/:** CSS files, will be copied (and potentially minified) to `build/css`. ([src/css/](#org6c81feb))
    -   **scss/:** [SCSS](https://sass-lang.com/documentation/syntax) files, will be run through [Sass](https://sass-lang.com/) and copied (and potentially minified) to `build/css`. ([src/scss/](#org39766ee))
-   **build/:** *Not in version control*. Root folder for all build related activities. E.g. the [building of index.org](#org8f444a0) happens in here. ([build/](#orgcea4946)). Later copied to `public/` by [Fill `public/`](#orgbe13aba).
    -   **.:** files that will end up in `public/` via copy. Before that, files will be transformed, e.g. by creating `index.html` by running [index.org](../src/index.md). ([Build index.org](#orga90b8d9))
    -   **img/:** images, will be copied to `public/img/.`
    -   **js/:** JavaScript files, will be copied to `public/js`. No further minification/uglification.
    -   **css/:** CSS files, will be copied (and potentially minified) to `public/css`.
-   **public/:** The final build result.
    -   **.:** Can be served via [`gulp serve`](#org52979a2) and packaged as a ZIP via [`gulp package`](#org8bbcddb).
    -   **img/:** images
    -   **js/:** JavaScript files
    -   **css/:** CSS files


<a id="orgb2b4fe6"></a>

### Flow between folders

![img](img/flow-between-folders.png)


<a id="org58f79f2"></a>

## TODO Configuration in `packages.json`


<a id="org9287d73"></a>

## Edit the presentation

The whole presentation is contained in <../src/index.md> and build via org-mode.


<a id="orgdfee428"></a>

## Required tools for building

-   **gulp:** Gulp is used for orchestrating the build
-   **Docker:** [index.org](../src/index.md) is compiled to html via [xuxxux/org-re-reveal-builder](https://hub.docker.com/repository/docker/xuxxux/org-re-reveal-builder) ([Dockerfile](../docker/Dockerfile))


<a id="org865b348"></a>

## Tools used by the author


<a id="orgfe52ea8"></a>

### `gulp` for building

The build is automated via [gulp](https://gulpjs.com/docs/en/getting-started/quick-start/). The configuration is done via the [gulpfile.js](../gulpfile.js) and NPMs [package.json](../package.json).

-   **gulpfile.json:** Contains the workflow. The goal is to keep the gulpfile static for a lot of projects.
-   **package.json:** Configures dependencies for build (`--save-dev`), runtime (`--save-prod`) and configuration like paths, urls, globs.


<a id="orgeb0b682"></a>

### `reveal.js` as presentation framework

[reveal.js](https://revealjs.com/) 4.x is used as presentation framework.


<a id="orgbe7a539"></a>

### `emacs` with `org-mode`, `org-babel`, `org-re-reveal` for writing/exporting


<a id="orgb240cbd"></a>

### `Docker` for transforming `org` to `html`


<a id="org07f6752"></a>

# Building this document

[BUILD.md](BUILD.md) is generated by exporting [BUILD.org](BUILD.md) via `C-c C-e g g` (via `org-gfm-export-to-markdown` from [ox-gfm](https://github.com/larstvei/ox-gfm)).


<a id="org64df198"></a>

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
      "scssIncludePaths": []
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
    "build_org_docker": "xuxxux/org-re-reveal-builder:0.1",
    "build_org_docker_local": "build-org"
  },
  "filter": {
    "publishThese": [
      "**/*",
      "!*.tmp",
      "!*.org",
      "!#*",
      "!*.tmp"
    ]
  }
}
```


<a id="org2e6ba4c"></a>

## Red Tape

Red tape to set up `gulp`.


<a id="org641fe44"></a>

### Make package.json available

```javascript
const pkg = require('./package.json')
```


<a id="orgf906186"></a>

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
    sourcemaps   : require('gulp-sourcemaps'),
    del : require('del'),
    favicons : require('favicons').stream
}
```


<a id="org37669f6"></a>

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


<a id="org167e948"></a>

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


<a id="orgfb19050"></a>

## Folders


<a id="org799f4bf"></a>

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


<a id="orge45a96b"></a>

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
            .pipe($.sass({includePaths: pkg.cfg.paths.include.scssIncludePaths /* .cfg.paths.include.scssIncludePaths := [] */
                })
                .on("error", $.sass.logError))
            .pipe($.autoprefixer())
            .pipe($.sourcemaps.write("./"))
            .pipe(dest(pkg.cfg.paths.build.css))       // .cfg.paths.build.css := "./build/css/"
    }
    src_scss_to_build.displayName = "Transform scss to build"
    src_scss_to_build.description = `Compile ${pkg.cfg.paths.src.scss} to build, create sourcemaps and autoprefix.`
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


<a id="orgcea4946"></a>

### build/

```javascript
/*
 * Scripts to build things in build.
 */
```

1.  Build index.org

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
                  throw new Error('kaboom: ' + err)
                }
            })
    }
    exports.build_org_file_with_docker = build_org_file_with_docker
    exports.build_org_file_with_docker.displayName = "Transform index.org via Docker"
    exports.build_org_file_with_docker.description = `Build index.org with "${pkg.cfg.vars.build_org_docker_local}" docker container.`
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
                                           build_org_file_with_docker))
    exports.finish_build.displayName = "build"
    exports.finish_build.description = `Populate and build ${pkg.cfg.paths.build.base}.`
    ```


<a id="orgc7b1737"></a>

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
      return src(pkg.cfg.paths.build.base + "**/*")
            .pipe($.filter(pkg.cfg.filter.publishThese))
            .pipe(dest(pkg.cfg.paths.dist.base))
    }
    public_copy_from_build.displayName = "Copy to build"
    public_copy_from_build.description = `Copy files matching ${pkg.cfg.filter.publishThese} from ${pkg.cfg.paths.build.base} to ${pkg.cfg.paths.dist.base}.`
    
    
    exports.publish = series(exports.finish_build,
                             public_copy_from_build)
    
    exports.publish.displayName = "publish"
    exports.publish.description = `Build the project and publish to ${pkg.cfg.paths.dist.base}.`
    exports.default = exports.publish
    ```


<a id="org818e646"></a>

## Utility Functions

```javascript
/*
 * Utility functions
 */
```


<a id="org8169408"></a>

### serve

Default values for the server started by [serve](#org8169408):

```javascript
const root = $.yargs.argv.root || pkg.cfg.paths.dist.base // .cfg.paths.dist.base := "./public/"
const port = $.yargs.argv.port || 8000
const host = $.yargs.argv.bind || '127.0.0.1'
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
        host: host,
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
serve.displayName = "serve"
serve.description = `Serve ${root} as http://${host}:${port}/. Override with --{host,port,root}.`
exports.serve = serve
```


<a id="org4f21619"></a>

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


clean.displayName = "clean"
clean.description = `Delete all build outputs (${pkg.cfg.paths.build.base}, ${pkg.cfg.paths.dist.base}).`
exports.clean = clean
```


<a id="org0e28ad3"></a>

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
