- [Overview](#orgc033c86)
  - [Design decisions](#org4355b2e)
  - [Directory layout](#org1312441)
    - [Flow between folders](#orgbce6760)
  - [Configuration in `packages.json`](#org6cec360)
  - [Edit the presentation](#org9f0d7fb)
  - [Build and publish](#org3ccbac8)
    - [`gulp default` - build `public/`](#orgafed9b3)
    - [`gulp serve` - development webserver with watch](#org51b0675)
    - [`gulp package` - create a ZIP](#orgad523dc)
  - [Required tools](#org34f3288)
- [Details](#orgcec375e)
  - [Tools used](#orgfa48e6a)
    - [`gulp` for building](#orgd013029)
    - [`reveal.js` as presentation framework](#org47e8a68)
    - [`emacs` with `org-mode`, `org-babel`, `org-re-reveal` for writing/exporting](#org059684e)
    - [`Docker` for transforming `org` to `html`](#orgd1b5f29)
  - [Build targets](#org510c13b)
- [Building this document](#orga4b92bc)
- [Building `gulpfile.js`](#org32b2e41)
  - [Red Tape](#orgb2f1dbd)
    - [Make package.json available](#orga51678e)
    - [Setup plugins for gulpfile](#org067a989)
    - [Configure Plugins](#org5085c03)
  - [Custom Functions](#org04e1f6c)
  - [Folders](#orgf8efff5)
    - [src](#org7fd67eb)



<a id="orgc033c86"></a>

# Overview


<a id="org4355b2e"></a>

## Design decisions

The whole process serves the simple matter of *creating a presentation*. That means neither bandwitdh nor page load speed are a primary consideration.

These are the primary design goals, from more general to more specific:

-   **Get the Job Done:** In the end the result in `public/` matters.
-   **Ease of Use:** The whole process must be easy to use with a [minimum set of required tools](#org34f3288).
-   **Automated Build:** The whole process needs to be automated.
-   **Support for `org-mode`:** This was the trigger. I wanted to use [emacs](https://www.gnu.org/software/emacs/) with [org-mode](https://orgmode.org/), [org-babel](https://orgmode.org/worg/org-contrib/babel/), and [org-re-reveal](https://gitlab.com/oer/org-re-reveal) for writing slides.
-   **Reuseable:** The whole system should be reusable across multiple presentations. *Ideally* a new presentation just needs some bootstrap (repository) and *content*.
-   **One Pipeline Per File:** Each file *should* only be modified (e.g. minify) in exactly *one* pipeline. Changing files in multiple pipelines makes it difficult to figure out *where* things happen.
-   **Configuration in [package.json](../package.json):** Ideally (see *Reuseable*) a new presentation only needs changes in [package.json](../package.json) and [index.org](../src/index.md).


<a id="org1312441"></a>

## Directory layout

The directory layout is quite simple: Files are moved from `{src, node_modules}` to `build`. In `build` files are generated (e.g. `.org` &#x2013;> `.html`) and then copied to `public`.

-   **node\_modules/:** [Modules](../package.json) installed via [npm](https://www.npmjs.com/). Copied to `build/js` via specific targets. TODO targets.
-   **src/:** Source files (*read-only* during build)
    -   **.:** files that will end up in `build/` via copy. [index.org](../src/index.md) is located here. TARGET TODO
    -   **img/:** images, will be copied to `build/img/.`. TARGETxxx TODO
    -   **js/:** JavaScript files, will be copied (and potentially minified & uglified) to `build/js`. TARGETxxx TODO
    -   **css/:** CSS files, will be copied (and potentially minified) to `build/css`. TARGETxxx TODO
    -   **scss/:** [SCSS](https://sass-lang.com/documentation/syntax) files, will be run through [Sass](https://sass-lang.com/) and copied (and potentially minified) to `build/css`. TARGETxxx TODO
-   **build/:** *Not in version control*. Root folder for all build related activities. E.g. the [building of index.org](#org3ccbac8) happens in here.
    -   **.:** files that will end up in `public/` via copy. Before that, files will be transformed, e.g. by creating `index.html` by running [index.org](../src/index.md). TARGET TODO
    -   **img/:** images, will be copied to `public/img/.`. TARGETxxx TODO
    -   **js/:** JavaScript files, will be copied to `public/js`. No further minification/uglification. TARGETxxx TODO
    -   **css/:** CSS files, will be copied (and potentially minified) to `public/css`. TARGETxxx TODO
-   **public/:** The final build result.
    -   **.:** Can be served via [`gulp serve`](#org51b0675) and packaged as a ZIP via [`gulp package`](#orgad523dc).
    -   **img/:** images
    -   **js/:** JavaScript files
    -   **css/:** CSS files


<a id="orgbce6760"></a>

### Flow between folders

![img](img/flow-between-folders.png)


<a id="org6cec360"></a>

## Configuration in `packages.json`


<a id="org9f0d7fb"></a>

## Edit the presentation

The whole presentation is contained in <../src/index.md> and build via org-mode.


<a id="org3ccbac8"></a>

## Build and publish

The final version will be published into the `public/` directory. Calling `gulp` (or `gulp default`) will build the whole presentation.

**It is important that the presentation is viewed via http(s)** since some JS libraries will not correctly work when served via the file system. [`gulp serve`](#org51b0675) starts a small webserver for that.


<a id="orgafed9b3"></a>

### `gulp default` - build `public/`

`gulp` or `gulp default` will update `public/` to the latest result.


<a id="org51b0675"></a>

### `gulp serve` - development webserver with watch

`gulp serve` will start a small webserver to view the results (via [gulp-serve](https://www.npmjs.com/package/gulp-serve)).


<a id="orgad523dc"></a>

### `gulp package` - create a ZIP

`gulp package` will create a ZIP file of `public/**/*`.


<a id="org34f3288"></a>

## Required tools

-   **gulp:** Gulp is used for orchestrating the build
-   **Docker:** [index.org](../src/index.md) is compiled to html via [xuxxux/org-re-reveal-builder](https://hub.docker.com/repository/docker/xuxxux/org-re-reveal-builder) ([Dockerfile](../docker/Dockerfile))


<a id="orgcec375e"></a>

# Details


<a id="orgfa48e6a"></a>

## Tools used


<a id="orgd013029"></a>

### `gulp` for building

The build is automated via [gulp](https://gulpjs.com/docs/en/getting-started/quick-start/). The configuration is done via the [gulpfile.js](../gulpfile.js) and NPMs [package.json](../package.json).

-   **gulpfile.json:** Contains the workflow. The goal is to keep the gulpfile static for a lot of projects.
-   **package.json:** Configures dependencies for build (`--save-dev`), runtime (`--save-prod`) and configuration like paths, urls, globs.


<a id="org47e8a68"></a>

### `reveal.js` as presentation framework

[reveal.js](https://revealjs.com/) 4.x is used as presentation framework.


<a id="org059684e"></a>

### `emacs` with `org-mode`, `org-babel`, `org-re-reveal` for writing/exporting


<a id="orgd1b5f29"></a>

### `Docker` for transforming `org` to `html`


<a id="org510c13b"></a>

## Build targets


<a id="orga4b92bc"></a>

# Building this document

[BUILD.md](BUILD.md) is generated by exporting [BUILD.org](BUILD.md) via `C-c C-e g g` (via `org-gfm-export-to-markdown` from [ox-:fm](https://github.com/larstvei/ox-gfm)).


<a id="org32b2e41"></a>

# Building `gulpfile.js`

`gulpfile.js` is generated by *tangling* <BUILD.md> via [org-babel](https://orgmode.org/manual/Extracting-Source-Code.html). The export is triggered by calling `org-babel-tangle` (`C-c C-v C-t`).

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
    }
  }
}
```


<a id="orgb2f1dbd"></a>

## Red Tape

Red tape to set up `gulp`.


<a id="orga51678e"></a>

### Make package.json available

```javascript
const pkg = require('./package.json')
```


<a id="org067a989"></a>

### Setup plugins for gulpfile

Most plugins are scoped under `$` to (a) make clear what is provided by a plugin and (b) prepare for automatically generating `$` from `package.json`.

```javascript
const { series, parallel } = require('gulp');
const { src, dest } = require('gulp');

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

    {rollup} : require('rollup'),
    {terser} : require('rollup-plugin-terser'),
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
    Vinyl : require('vinyl'),
    shell : require('gulp-shell'),
    fs   : require('fs'),
    fancylog   : require('fancylog'),
    sourcemaps   : require('sourcemaps')
}
```


<a id="org5085c03"></a>

### Configure Plugins

Default values for the server started by [watch](#org19b0a8a):

```javascript
const root = yargs.argv.root || pkg.paths.dist.base
const port = yargs.argv.port || 8000
```

Banner prefixed to my scripts:

```javascript
const banner = `/*!
 * ${pkg.name}  ${pkg.version}
 * ${pkg.homepage}
 * ${pkg.license}
 *
 * ${pkg.copyright} ${pkg.author.name}, ${pkg.author.web}
*/\n`
```

Prevent warnings from opening too many test pages:

```javascript
process.setMaxListeners(20)
```


<a id="org04e1f6c"></a>

## Custom Functions


<a id="orgf8efff5"></a>

## Folders


<a id="org7fd67eb"></a>

### src

```javascript
/*
 * Scripts to get things from src to build.
 */
```

1.  TODO src/

    Copy all files into the build directory.
    
    ```javascript
    function src_root_to_build() {
      return src(pkg.cfg.paths.src.base + '*') // .cfg.paths.src.base :="./src/"
        .pipe(dest(pkg.cfg.paths.build.base))  // .cfg.paths.build.base :="./build/"
    }
    ```

2.  src/img/

    Copy all images into the build directory.
    
    ```javascript
    function src_img_to_build() {
      return src(pkg.cfg.paths.src.img + '**/*.{png,jpg,jpeg,gif,svg}') // .cfg.paths.src.img :="./src/img/"
        .pipe(dest(pkg.cfg.paths.build.img))                            // .cfg.paths.build.img :="./build/img/"
    }
    ```

3.  src/js/

    Javascript will be linted, prefixed with a banner and then copied into the build directory.
    
    ```javascript
    function src_lint_js() {
      $.fancyLog("-> Linting js in src")
      return src([pkg.cfg.paths.src.js + '**/*.js', 'gulpfile.js']) // .cfg.paths.src.js :="./src/js/"
            .pipe(eslint())
            .pipe(eslint.format()))
    }
    ```
    
    ```javascript
    function src_copy_js_to_build() {
      $.fancyLog("-> Copy js to build")
      return src(pkg.cfg.paths.src.js + '**/*.js') // .cfg.paths.src.js :="./src/js/"
        .pipe(header(banner))
        .pipe(dest(pkg.cfg.paths.build.js))        // .cfg.paths.build.js :="./build/js/"
    }
    ```
    
    ```javascript
    function src_js_to_build() {
      return series(src_lint_js, src_copy_js_to_build)
    }
    ```

4.  src/css/

    ```javascript
    function src_css_to_build() {
      $.fancyLog("-> Copy css to build")
      return src(pkg.cfg.paths.src.css + '**/*.css') // .cfg.paths.src.css :="./src/css/"
            .pipe($.sourcemaps.init({loadMaps: true}))
            .pipe($.autoprefixer())
            .pipe($.sourcemaps.write("./"))
            .pipe(dest(pkg.cfg.paths.build.css))     // .cfg.paths.build.css :="./build/css/"
    }
    ```

5.  src/scss/

    ```javascript
    function src_scss_to_build() {
      $.fancyLog("-> Compiling scss to build")
      return src(pkg.cfg.paths.src.scss + '**/*.scss') // .cfg.paths.src.scss :="./src/scss/"
            .pipe($.sourcemaps.init({loadMaps: true}))
            .pipe($.sass({
                    includePaths: pkg.paths.scss TODO
                })
                .on("error", $.sass.logError))
            .pipe($.autoprefixer())
            .pipe($.sourcemaps.write("./"))
            .pipe(dest(pkg.cfg.paths.build.css))       // .cfg.paths.build.scss :=null
    }
    ```

6.  Combined rules for `src/`

    ```javascript
    function src_to_build() {
          return parallel(src_root_to_build,
                          src_img_to_build,
                          src_js_to_build,
                          src_css_to_build,
                          src_scss_to_build)
    }
    exports.src_to_build = src_to_build
    ```
