# Overview

## Design decisions

The whole process serves the simple matter of *creating a presentation*.
That means neither bandwitdh nor page load speed are a primary
consideration.

These are the primary design goals, from more general to more specific:

Get the Job Done  
In the end the result in `public/` matters.

Ease of Use  
The whole process must be easy to use with a [minimum set of required
tools](id:6dd3eadc-eb0c-474a-964a-b5d8e3298390).

Automated Build  
The whole process needs to be automated.

Support for `org-mode`  
This was the trigger. I wanted to use
[emacs](https://www.gnu.org/software/emacs/) with
[org-mode](https://orgmode.org/),
[org-babel](https://orgmode.org/worg/org-contrib/babel/), and
[org-re-reveal](https://gitlab.com/oer/org-re-reveal) for writing
slides.

Reuseable  
The whole system should be reusable across multiple presentations.
*Ideally* a new presentation just needs some bootstrap (repository) and
*content*.

One Pipeline Per File  
Each file *should* only be modified (e.g. minify) in exactly *one*
pipeline. Changing files in multiple pipelines makes it difficult to
figure out *where* things happen.

Configuration in [package.json](../package.json)  
Ideally (see *Reuseable*) a new presentation only needs changes in
[package.json](../package.json) and [index.org](../src/index.org).

## Directory layout

The directory layout is quite simple: Files are moved from
`{src, node_modules}` to `build`. In `build` files are generated (e.g.
`.org` –&gt; `.html`) and then copied to `public`.

node\_modules/  
[Modules](../package.json) installed via [npm](https://www.npmjs.com/).
Copied to `build/js` via specific targets. TODO targets.

src/  
Source files (*read-only* during build)

.  
files that will end up in `build/` via copy.
[index.org](../src/index.org) is located here. TARGET TODO

img/  
images, will be copied to `build/img/.`. TARGETxxx TODO

js/  
JavaScript files, will be copied (and potentially minified & uglified)
to `build/js`. TARGETxxx TODO

css/  
CSS files, will be copied (and potentially minified) to `build/css`.
TARGETxxx TODO

scss/  
[SCSS](https://sass-lang.com/documentation/syntax) files, will be run
through [Sass](https://sass-lang.com/) and copied (and potentially
minified) to `build/css`. TARGETxxx TODO

build/  
*Not in version control*. Root folder for all build related activities.
E.g. the [building of
index.org](id:2b7f9a55-6c27-416f-afd4-21e6e1f80ca5) happens in here.

.  
files that will end up in `public/` via copy. Before that, files will be
transformed, e.g. by creating `index.html` by running
[index.org](../src/index.org). TARGET TODO

img/  
images, will be copied to `public/img/.`. TARGETxxx TODO

js/  
JavaScript files, will be copied to `public/js`. No further
minification/uglification. TARGETxxx TODO

css/  
CSS files, will be copied (and potentially minified) to `public/css`.
TARGETxxx TODO

public/  
The final build result.

.  
Can be served via
[`gulp serve`](id:8879b480-5de7-4984-978a-0645337d26b4) and packaged as
a ZIP via [`gulp package`](id:4ab8166f-97e4-433c-ab2e-b4ca7f39e950).

img/  
images

js/  
JavaScript files

css/  
CSS files

### Flow between folders

![](img/flow-between-folders.png)

## Configuration in `packages.json`

## Edit `org` file

## Build and publish

The final version will be published into the `public/` directory.
Calling `gulp` (or `gulp default`) will build the whole presentation.

**It is important that the presentation is viewed via http(s)** since
some JS libraries will not correctly work when served via the file
system. [`gulp serve`](id:8879b480-5de7-4984-978a-0645337d26b4) starts a
small webserver for that.

### `gulp default` - build `public/`

`gulp` or `gulp default` will update `public/` to the latest result.

### `gulp serve` - development webserver with watch

`gulp serve` will start a small webserver to view the results (via
[gulp-serve](https://www.npmjs.com/package/gulp-serve)).

### `gulp package` - create a ZIP

`gulp package` will create a ZIP file of `public/**/*`.

## Required tools

gulp  
Gulp is used for orchestrating the build

Docker  
[index.org](../src/index.org) is compiled to html via
[xuxxux/org-re-reveal-builder](https://hub.docker.com/repository/docker/xuxxux/org-re-reveal-builder)
([Dockerfile](../docker/Dockerfile))

# Details

## Tools used

### `gulp` for building

The build is automated via
[gulp](https://gulpjs.com/docs/en/getting-started/quick-start/). The
configuration is done via the [gulpfile.js](../gulpfile.js) and NPMs
[package.json](../package.json).

gulpfile.json  
Contains the workflow. The goal is to keep the gulpfile static for a lot
of projects.

package.json  
Configures dependencies for build (`--save-dev`), runtime
(`--save-prod`) and configuration like paths, urls, globs.

### `reveal.js` as presentation framework

[reveal.js](https://revealjs.com/) 4.x is used as presentation
framework.

### `emacs` with `org-mode`, `org-babel`, `org-re-reveal` for writing/exporting

### `Docker` for transforming `org` to `html`

## Build targets

# Building this document

[BUILD.md](BUILD.md) is generated by exporting [BUILD.org](BUILD.org)
via `C-c C-e m m` (via `org-md-export-to-markdown`).

# Building `gulpfile.js`

// jq ".author" package.json { "name": "Jens Neuhalfen", "email":
"jens@neuhalfen.name", "web": "<https://neuhalfen.name/>" }

`gulpfile.js` is generated by *tangling* [file:BUILD.org](BUILD.org) via
[org-babel](https://orgmode.org/manual/Extracting-Source-Code.html). The
export is triggered by calling `org-babel-tangle` (`C-c C-v C-t`).

## Red Tape

Red tape to set up `gulp`.

### Make package.json available

``` javascript
const pkg = require('./package.json')
```

### Setup plugins for gulpfile

Most plugins are scoped under `$` to (a) make clear what is provided by
a plugin and (b) prepare for automatically generating `$` from
`package.json`.

``` javascript
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

### Configure Plugins

Default values for the server started by
[watch](id:5956f2e3-b139-435c-894c-3baba0608b50):

``` javascript
const root = yargs.argv.root || pkg.paths.dist.base
const port = yargs.argv.port || 8000
```

Banner prefixed to my scripts:

``` javascript
const banner = `/*!
 * ${pkg.name}  ${pkg.version}
 * ${pkg.homepage}
 * ${pkg.license}
 *
 * ${pkg.copyright} ${pkg.author.name}, ${pkg.author.web}
*/\n`
```

Prevent warnings from opening too many test pages:

``` javascript
process.setMaxListeners(20)
```

## Custom Functions

## Exposed Commands

### watch
