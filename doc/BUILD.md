- [Overview](#orgb9de7cd)
  - [Design decisions](#org8cdf890)
  - [Directory layout](#org4166be1)
    - [Flow between folders](#org85d0c40)
  - [Configuration in `packages.json`](#orga4e46a9)
  - [Edit `org` file](#orgf237308)
  - [Build and publish](#org6ce016a)
    - [`gulp default` - build `public/`](#orgfcd6306)
    - [`gulp serve` - development webserver with watch](#org93fec70)
    - [`gulp package` - create a ZIP](#org5740c29)
  - [Required tools](#org4061ce0)
- [Details](#orgced6106)
  - [Tools used](#orgae173fa)
    - [`gulp` for building](#org78ada16)
    - [`reveal.js` as presentation framework](#org9893a83)
    - [`emacs` with `org-mode`, `org-babel`, `org-re-reveal` for writing/exporting](#org3ccb21f)
    - [`Docker` for transforming `org` to `html`](#org910983d)
  - [Build targets](#org5092ce8)
- [Building this document](#orgfb0073d)
- [Building `gulpfile.js`](#org7efa7a3)
  - [Red Tape](#org36b156b)
    - [Make package.json available](#orge9d9f7c)
    - [Setup plugins for gulpfile](#orgb4bb64c)
    - [Configure Plugins](#orgcd44a4d)
  - [Custom Functions](#orga1245be)
  - [Exposed Commands](#org852fc56)
    - [watch](#org2728180)



<a id="orgb9de7cd"></a>

# Overview


<a id="org8cdf890"></a>

## Design decisions

The whole process serves the simple matter of *creating a presentation*. That means neither bandwitdh nor page load speed are a primary consideration.

These are the primary design goals, from more general to more specific:

-   **Get the Job Done:** In the end the result in `public/` matters.
-   **Ease of Use:** The whole process must be easy to use with a [minimum set of required tools](#org4061ce0).
-   **Automated Build:** The whole process needs to be automated.
-   **Support for `org-mode`:** This was the trigger. I wanted to use [emacs](https://www.gnu.org/software/emacs/) with [org-mode](https://orgmode.org/), [org-babel](https://orgmode.org/worg/org-contrib/babel/), and [org-re-reveal](https://gitlab.com/oer/org-re-reveal) for writing slides.
-   **Reuseable:** The whole system should be reusable across multiple presentations. *Ideally* a new presentation just needs some bootstrap (repository) and *content*.
-   **One Pipeline Per File:** Each file *should* only be modified (e.g. minify) in exactly *one* pipeline. Changing files in multiple pipelines makes it difficult to figure out *where* things happen.
-   **Configuration in [package.json](../package.json):** Ideally (see *Reuseable*) a new presentation only needs changes in [package.json](../package.json) and [index.org](../src/index.md).


<a id="org4166be1"></a>

## Directory layout

The directory layout is quite simple: Files are moved from `{src, node_modules}` to `build`. In `build` files are generated (e.g. `.org` &#x2013;> `.html`) and then copied to `public`.

-   **node\_modules/:** [Modules](../package.json) installed via [npm](https://www.npmjs.com/). Copied to `build/js` via specific targets. TODO targets.
-   **src/:** Source files (*read-only* during build)
    -   **.:** files that will end up in `build/` via copy. [index.org](../src/index.md) is located here. TARGET TODO
    -   **img/:** images, will be copied to `build/img/.`. TARGETxxx TODO
    -   **js/:** JavaScript files, will be copied (and potentially minified & uglified) to `build/js`. TARGETxxx TODO
    -   **css/:** CSS files, will be copied (and potentially minified) to `build/css`. TARGETxxx TODO
    -   **scss/:** [SCSS](https://sass-lang.com/documentation/syntax) files, will be run through [Sass](https://sass-lang.com/) and copied (and potentially minified) to `build/css`. TARGETxxx TODO
-   **build/:** *Not in version control*. Root folder for all build related activities. E.g. the [building of index.org](#org6ce016a) happens in here.
    -   **.:** files that will end up in `public/` via copy. Before that, files will be transformed, e.g. by creating `index.html` by running [index.org](../src/index.md). TARGET TODO
    -   **img/:** images, will be copied to `public/img/.`. TARGETxxx TODO
    -   **js/:** JavaScript files, will be copied to `public/js`. No further minification/uglification. TARGETxxx TODO
    -   **css/:** CSS files, will be copied (and potentially minified) to `public/css`. TARGETxxx TODO
-   **public/:** The final build result.
    -   **.:** Can be served via [`gulp serve`](#org93fec70) and packaged as a ZIP via [`gulp package`](#org5740c29).
    -   **img/:** images
    -   **js/:** JavaScript files
    -   **css/:** CSS files


<a id="org85d0c40"></a>

### Flow between folders

![img](img/flow-between-folders.png)


<a id="orga4e46a9"></a>

## Configuration in `packages.json`


<a id="orgf237308"></a>

## Edit `org` file


<a id="org6ce016a"></a>

## Build and publish

The final version will be published into the `public/` directory. Calling `gulp` (or `gulp default`) will build the whole presentation.

**It is important that the presentation is viewed via http(s)** since some JS libraries will not correctly work when served via the file system. [`gulp serve`](#org93fec70) starts a small webserver for that.


<a id="orgfcd6306"></a>

### `gulp default` - build `public/`

`gulp` or `gulp default` will update `public/` to the latest result.


<a id="org93fec70"></a>

### `gulp serve` - development webserver with watch

`gulp serve` will start a small webserver to view the results (via [gulp-serve](https://www.npmjs.com/package/gulp-serve)).


<a id="org5740c29"></a>

### `gulp package` - create a ZIP

`gulp package` will create a ZIP file of `public/**/*`.


<a id="org4061ce0"></a>

## Required tools

-   **gulp:** Gulp is used for orchestrating the build
-   **Docker:** [index.org](../src/index.md) is compiled to html via [xuxxux/org-re-reveal-builder](https://hub.docker.com/repository/docker/xuxxux/org-re-reveal-builder) ([Dockerfile](../docker/Dockerfile))


<a id="orgced6106"></a>

# Details


<a id="orgae173fa"></a>

## Tools used


<a id="org78ada16"></a>

### `gulp` for building

The build is automated via [gulp](https://gulpjs.com/docs/en/getting-started/quick-start/). The configuration is done via the [gulpfile.js](../gulpfile.js) and NPMs [package.json](../package.json).

-   **gulpfile.json:** Contains the workflow. The goal is to keep the gulpfile static for a lot of projects.
-   **package.json:** Configures dependencies for build (`--save-dev`), runtime (`--save-prod`) and configuration like paths, urls, globs.


<a id="org9893a83"></a>

### `reveal.js` as presentation framework

[reveal.js](https://revealjs.com/) 4.x is used as presentation framework.


<a id="org3ccb21f"></a>

### `emacs` with `org-mode`, `org-babel`, `org-re-reveal` for writing/exporting


<a id="org910983d"></a>

### `Docker` for transforming `org` to `html`


<a id="org5092ce8"></a>

## Build targets


<a id="orgfb0073d"></a>

# Building this document

[BUILD.md](BUILD.md) is generated by exporting [BUILD.org](BUILD.md) via `C-c C-e g g` (via `org-gfm-export-to-markdown` from [ox-:fm](https://github.com/larstvei/ox-gfm)).


<a id="org7efa7a3"></a>

# Building `gulpfile.js`

    // jq ".author" package.json
    {
      "name": "Jens Neuhalfen",
      "email": "jens@neuhalfen.name",
      "web": "https://neuhalfen.name/"
    }

`gulpfile.js` is generated by *tangling* <BUILD.md> via [org-babel](https://orgmode.org/manual/Extracting-Source-Code.html). The export is triggered by calling `org-babel-tangle` (`C-c C-v C-t`).


<a id="org36b156b"></a>

## Red Tape

Red tape to set up `gulp`.


<a id="orge9d9f7c"></a>

### Make package.json available

```javascript
const pkg = require('./package.json')
```


<a id="orgb4bb64c"></a>

### Setup plugins for gulpfile

Most plugins are scoped under `$` to (a) make clear what is provided by a plugin and (b) prepare for automatically generating `$` from `package.json`.

```javascript
const { series, parallel } = require('gulp');

const $ = {
    if : require('gulp-if'),
    newer : require('gulp-newer'),
    filter : require('gulp-filter'),
    rename : require('gulp-rename')

    path : require('path')
    glob : require('glob')
    yargs : require('yargs')
    colors : require('colors')

    // Testing
    qunit : require('node-qunit-puppeteer')

    {rollup} : require('rollup')
    {terser} : require('rollup-plugin-terser')
    babel : require('@rollup/plugin-babel').default
    commonjs : require('@rollup/plugin-commonjs')
    resolve : require('@rollup/plugin-node-resolve').default

    tap : require('gulp-tap')
    zip : require('gulp-zip')
    sass : require('gulp-sass')
    header : require('gulp-header')
    eslint : require('gulp-eslint')
    minify : require('gulp-clean-css')
    connect : require('gulp-connect')
    autoprefixer : require('gulp-autoprefixer')
    merge : require('merge-stream')
    Vinyl : require('vinyl')
    shell : require('gulp-shell')
    fs   : require('fs');
}
```


<a id="orgcd44a4d"></a>

### Configure Plugins

Default values for the server started by [watch](#org2728180):

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


<a id="orga1245be"></a>

## Custom Functions


<a id="org852fc56"></a>

## Exposed Commands


<a id="org2728180"></a>

### watch
