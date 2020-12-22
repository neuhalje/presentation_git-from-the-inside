
# Table of Contents

1.  [Overview](#orgd89c66b)
    1.  [Design decisions](#org49938d7)
    2.  [Directory layout](#orgbbaaed6)
        1.  [Flow between folders](#org5d8df3a)
    3.  [Configuration in `packages.json`](#org3060305)
    4.  [Edit `org` file](#org21fa9cc)
    5.  [Build and publish](#org90371b8)
        1.  [`gulp default` - build `public/`](#org0c66d8e)
        2.  [`gulp serve` - development webserver with watch](#orgb3141e6)
        3.  [`gulp package` - create a ZIP](#org58836e7)
    6.  [Required tools](#org1a3bdc1)
2.  [Details](#orgf2d629f)
    1.  [Tools used](#org69e3387)
        1.  [`gulp` for building](#orgeb3603e)
        2.  [`reveal.js` as presentation framework](#orge48282d)
        3.  [`emacs` with `org-mode`, `org-babel`, `org-re-reveal` for writing/exporting](#org4945998)
        4.  [`Docker` for transforming `org` to `html`](#orgfc2678b)
    2.  [Build targets](#orgcc4fab1)
3.  [Building this document](#orgf70a535)
4.  [Building `gulpfile.js`](#orgcfac9c8)
    1.  [Red Tape](#org8973c38)
        1.  [Make package.json available](#orgd985345)
        2.  [Setup plugins for gulpfile](#org4d9bfe3)
        3.  [Configure Plugins](#org410b5be)
    2.  [Custom Functions](#orgd7831f3)
    3.  [Exposed Commands](#org02ab13e)
        1.  [watch](#org5f614c1)



<a id="orgd89c66b"></a>

# Overview


<a id="org49938d7"></a>

## Design decisions

The whole process serves the simple matter of *creating a presentation*. That means neither bandwitdh nor page load speed are a primary consideration.

These are the primary design goals, from more general to more specific:

-   **Get the Job Done:** In the end the result in `public/` matters.
-   **Ease of Use:** The whole process must be easy to use with a [minimum set of required tools](#org1a3bdc1).
-   **Automated Build:** The whole process needs to be automated.
-   **Support for `org-mode`:** This was the trigger. I wanted to use [emacs](https://www.gnu.org/software/emacs/) with [org-mode](https://orgmode.org/), [org-babel](https://orgmode.org/worg/org-contrib/babel/), and [org-re-reveal](https://gitlab.com/oer/org-re-reveal) for writing slides.
-   **Reuseable:** The whole system should be reusable across multiple presentations. *Ideally* a new presentation just needs some bootstrap (repository) and *content*.
-   **One Pipeline Per File:** Each file *should* only be modified (e.g. minify) in exactly *one* pipeline. Changing files in multiple pipelines makes it difficult to figure out *where* things happen.
-   **Configuration in [package.json](../package.json):** Ideally (see *Reuseable*) a new presentation only needs changes in [package.json](../package.json) and [index.org](../src/index.md).


<a id="orgbbaaed6"></a>

## Directory layout

The directory layout is quite simple: Files are moved from `{src, node_modules}` to `build`. In `build` files are generated (e.g. `.org` &#x2013;> `.html`) and then copied to `public`.

-   **node\_modules/:** [Modules](../package.json) installed via [npm](https://www.npmjs.com/). Copied to `build/js` via specific targets. TODO targets.
-   **src/:** Source files (*read-only* during build)
    -   **.:** files that will end up in `build/` via copy. [index.org](../src/index.md) is located here. TARGET TODO
    -   **img/:** images, will be copied to `build/img/.`. TARGETxxx TODO
    -   **js/:** JavaScript files, will be copied (and potentially minified & uglified) to `build/js`. TARGETxxx TODO
    -   **css/:** CSS files, will be copied (and potentially minified) to `build/css`. TARGETxxx TODO
    -   **scss/:** [SCSS](https://sass-lang.com/documentation/syntax) files, will be run through [Sass](https://sass-lang.com/) and copied (and potentially minified) to `build/css`. TARGETxxx TODO
-   **build/:** *Not in version control*. Root folder for all build related activities. E.g. the [building of index.org](#org90371b8) happens in here.
    -   **.:** files that will end up in `public/` via copy. Before that, files will be transformed, e.g. by creating `index.html` by running [index.org](../src/index.md). TARGET TODO
    -   **img/:** images, will be copied to `public/img/.`. TARGETxxx TODO
    -   **js/:** JavaScript files, will be copied to `public/js`. No further minification/uglification. TARGETxxx TODO
    -   **css/:** CSS files, will be copied (and potentially minified) to `public/css`. TARGETxxx TODO
-   **public/:** The final build result.
    -   **.:** Can be served via [`gulp serve`](#orgb3141e6) and packaged as a ZIP via  [`gulp package`](#org58836e7).
    -   **img/:** images
    -   **js/:** JavaScript files
    -   **css/:** CSS files


<a id="org5d8df3a"></a>

### Flow between folders

![img](img/flow-between-folders.png)


<a id="org3060305"></a>

## Configuration in `packages.json`


<a id="org21fa9cc"></a>

## Edit `org` file


<a id="org90371b8"></a>

## Build and publish

The final version will be published into the `public/` directory. Calling `gulp` (or `gulp default`) will build the whole presentation.

**It is important that the presentation is viewed via http(s)** since some JS libraries will not correctly work when served via the file system. [`gulp serve`](#orgb3141e6) starts a small webserver for that.


<a id="org0c66d8e"></a>

### `gulp default` - build `public/`

`gulp` or `gulp default` will update `public/` to the latest result.


<a id="orgb3141e6"></a>

### `gulp serve` - development webserver with watch

`gulp serve` will start a small webserver to view the results (via [gulp-serve](https://www.npmjs.com/package/gulp-serve)).


<a id="org58836e7"></a>

### `gulp package` - create a ZIP

`gulp package` will create a ZIP file of `public/**/*`.


<a id="org1a3bdc1"></a>

## Required tools

-   **gulp:** Gulp is used for orchestrating the build
-   **Docker:** [index.org](../src/index.md) is compiled to html via [xuxxux/org-re-reveal-builder](https://hub.docker.com/repository/docker/xuxxux/org-re-reveal-builder) ([Dockerfile](../docker/Dockerfile))


<a id="orgf2d629f"></a>

# Details


<a id="org69e3387"></a>

## Tools used


<a id="orgeb3603e"></a>

### `gulp` for building

The build is automated via [gulp](https://gulpjs.com/docs/en/getting-started/quick-start/). The configuration is done via the [gulpfile.js](../gulpfile.js) and  NPMs [package.json](../package.json).

-   **gulpfile.json:** Contains the workflow. The goal is to keep the gulpfile static for a lot of projects.
-   **package.json:** Configures dependencies for build (`--save-dev`), runtime (`--save-prod`) and configuration like paths, urls, globs.


<a id="orge48282d"></a>

### `reveal.js` as presentation framework

[reveal.js](https://revealjs.com/) 4.x is used as presentation framework.


<a id="org4945998"></a>

### `emacs` with `org-mode`, `org-babel`, `org-re-reveal` for writing/exporting


<a id="orgfc2678b"></a>

### `Docker` for transforming `org` to `html`


<a id="orgcc4fab1"></a>

## Build targets


<a id="orgf70a535"></a>

# Building this document

[BUILD.md](BUILD.md) is generated by exporting [BUILD.org](BUILD.md) via `C-c C-e m m` (via `org-md-export-to-markdown`).


<a id="orgcfac9c8"></a>

# Building `gulpfile.js`

    // jq ".author" package.json
    {
      "name": "Jens Neuhalfen",
      "email": "jens@neuhalfen.name",
      "web": "https://neuhalfen.name/"
    }

`gulpfile.js` is generated by *tangling* <BUILD.md> via [org-babel](https://orgmode.org/manual/Extracting-Source-Code.html). The export is triggered by calling `org-babel-tangle` (`C-c C-v C-t`).


<a id="org8973c38"></a>

## Red Tape

Red tape to set up `gulp`.


<a id="orgd985345"></a>

### Make package.json available

    const pkg = require('./package.json')


<a id="org4d9bfe3"></a>

### Setup plugins for gulpfile

Most plugins are scoped under `$` to (a) make clear what is provided by a plugin and (b) prepare for automatically generating `$` from `package.json`.

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


<a id="org410b5be"></a>

### Configure Plugins

Default values for the server started by [watch](#org5f614c1):

    const root = yargs.argv.root || pkg.paths.dist.base
    const port = yargs.argv.port || 8000

Banner prefixed to my scripts:

    const banner = `/*!
     * ${pkg.name}  ${pkg.version}
     * ${pkg.homepage}
     * ${pkg.license}
     *
     * ${pkg.copyright} ${pkg.author.name}, ${pkg.author.web}
    */\n`

Prevent warnings from opening too many test pages:

    process.setMaxListeners(20)


<a id="orgd7831f3"></a>

## Custom Functions


<a id="org02ab13e"></a>

## Exposed Commands


<a id="org5f614c1"></a>

### watch

