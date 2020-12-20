const pkg = require('./package.json')
const path = require('path')
const glob = require('glob')
const yargs = require('yargs')
const colors = require('colors')
const qunit = require('node-qunit-puppeteer')

const {rollup} = require('rollup')
const {terser} = require('rollup-plugin-terser')
const babel = require('@rollup/plugin-babel').default
const commonjs = require('@rollup/plugin-commonjs')
const resolve = require('@rollup/plugin-node-resolve').default

const gulp = require('gulp')
const tap = require('gulp-tap')
const zip = require('gulp-zip')
const sass = require('gulp-sass')
const header = require('gulp-header')
const eslint = require('gulp-eslint')
const minify = require('gulp-clean-css')
const connect = require('gulp-connect')
const merge = require('merge-stream')
const autoprefixer = require('gulp-autoprefixer')
const Vinyl = require('vinyl')
const shell = require('gulp-shell')
const fs   = require('fs');

const root = yargs.argv.root || pkg.paths.dist.base
const port = yargs.argv.port || 8000

const $ = {
    if : require('gulp-if'),
    newer : require('gulp-newer'),
    filter : require('gulp-filter'),
    rename : require('gulp-rename')
}


const banner = `/*!
* ${pkg.name}  ${pkg.version}
* ${pkg.homepage}
* ${pkg.license}
*
* ${pkg.copyright} ${pkg.author.name}, ${pkg.author.web}
*/\n`

// Prevents warnings from opening too many test pages
process.setMaxListeners(20);

const babelConfig = {
    babelHelpers: 'bundled',
    ignore: ['node_modules'],
    compact: false,
    extensions: ['.js', '.html'],
    plugins: [
        'transform-html-import-to-string'
    ],
    presets: [[
        '@babel/preset-env',
        {
            corejs: 3,
            useBuiltIns: 'usage',
            modules: false
        }
    ]]
};

// Our ES module bundle only targets newer browsers with
// module support. Browsers are targeted explicitly instead
// of using the "esmodule: true" target since that leads to
// polyfilling older browsers and a larger bundle.
const babelConfigESM = JSON.parse( JSON.stringify( babelConfig ) );
babelConfigESM.presets[0][1].targets = { browsers: [
    'last 2 Chrome versions', 'not Chrome < 60',
    'last 2 Safari versions', 'not Safari < 10.1',
    'last 2 iOS versions', 'not iOS < 10.3',
    'last 2 Firefox versions', 'not Firefox < 60',
    'last 2 Edge versions', 'not Edge < 16',
] };

let cache = {};


// Creates a UMD and ES module bundle for each of our
// built-in plugins

// gulp.task('plugins', () => {
//     return Promise.all([
//         { name: 'RevealHighlight', input: './plugin/highlight/plugin.js', output: './plugin/highlight/highlight' },
//         { name: 'RevealMarkdown', input: './plugin/markdown/plugin.js', output: './plugin/markdown/markdown' },
//         { name: 'RevealSearch', input: './plugin/search/plugin.js', output: './plugin/search/search' },
//         { name: 'RevealNotes', input: './plugin/notes/plugin.js', output: './plugin/notes/notes' },
//         { name: 'RevealZoom', input: './plugin/zoom/plugin.js', output: './plugin/zoom/zoom' },
//         { name: 'RevealMath', input: './plugin/math/plugin.js', output: './plugin/math/math' },
//     ].map( plugin => {
//         return rollup({
//                 cache: cache[plugin.input],
//                 input: plugin.input,
//                 plugins: [
//                     resolve(),
//                     commonjs(),
//                     babel({
//                         ...babelConfig,
//                         ignore: [/node_modules\/(?!(highlight\.js|marked)\/).*/],
//                     }),
//                     terser()
//                 ]
//             }).then( bundle => {
//                 cache[plugin.input] = bundle.cache;
//                 bundle.write({
//                     file: plugin.output + '.esm.js',
//                     name: plugin.name,
//                     format: 'es'
//                 })

//                 bundle.write({
//                     file: plugin.output + '.js',
//                     name: plugin.name,
//                     format: 'umd'
//                 })
//             });
//     } ));
// })

////////////////////// {{{ static assets
gulp.task('html', () => gulp.src(pkg.globs.html)
        .pipe(gulp.dest(pkg.paths.dist.base)))

gulp.task('img', () => gulp.src(pkg.globs.img)
        .pipe(gulp.dest(pkg.paths.dist.img)))

gulp.task('fonts', () => gulp.src(pkg.globs.fonts)
        .pipe(gulp.dest(pkg.paths.dist.fonts)))

gulp.task('assets', gulp.parallel('img', 'fonts'))
////////////////////// }}}

//////////////////////  {{{ JavaScript
// Creates a bundle with broad browser support, exposed
// as UMD
gulp.task('js-es5', () => {
    return rollup({
        cache: cache.umd,
        input: pkg.paths.src.js +'index.js',
        plugins: [
            resolve(),
            commonjs(),
            babel( babelConfig ),
            terser()
        ]
    }).then( bundle => {
        cache.umd = bundle.cache;
        return bundle.write({
            name: 'slides',
            file: pkg.paths.build.js + 'slides.js',
            format: 'umd',
            banner: banner,
            sourcemap: true
        });
    });
})

// Creates an ES module bundle
gulp.task('js-es6', () => {
    return rollup({
        cache: cache.esm,
        input: pkg.paths.src.js +'index.js',
        plugins: [
            resolve(),
            commonjs(),
            babel( babelConfigESM ),
            terser()
        ]
    }).then( bundle => {
        cache.esm = bundle.cache;
        return bundle.write({
            file: pkg.paths.build.js + 'slides.esm.js',
            format: 'es',
            banner: banner,
            sourcemap: true
        });
    });
})

// FIXME: .pipe(babel(babelConfig)) --> TypeError: dest.on is not a function
gulp.task('js-babel', () => gulp.src(pkg.globs.babelJs)
          .pipe(gulp.dest(pkg.paths.build.js)));

gulp.task('rename-files', () => {
    var streams = [];

    pkg.distRename.forEach( function(entry)
        {
        var stream = gulp.src(entry[0])
                            .pipe($.rename(entry[1]))
                            .pipe(gulp.dest(entry[2]));
         streams.push(stream);
        });
    return merge(streams);
    }
)

gulp.task('OLD-js-to-public',  () => gulp.src(pkg.globs.distJs)
        .pipe($.if(["*.js", "!*.min.js"],
            $.newer({dest: pkg.paths.dist.js, ext: ".min.js"}),
            $.newer({dest: pkg.paths.dist.js})
        ))
        .pipe($.if(["*.js", "!*.min.js"],
            $.rename({suffix: ".min"})
        ))
        .pipe(gulp.dest(pkg.paths.dist.js))
          .pipe($.filter("**/*.js")));

gulp.task('js-to-public',  () => gulp.src(pkg.globs.distJs)
        .pipe(gulp.dest(pkg.paths.dist.js))
          .pipe($.filter("**/*.js")));

gulp.task('js', gulp.series(gulp.parallel('js-es5', 'js-es6'), 'js-babel', 'js-to-public'));
////////////////////// }}}

//////////////////////   {{{ CSS

gulp.task('css-themes', () => gulp.src([ pkg.paths.src.scss + '/theme/source/*.{sass,scss}'])
        .pipe(sass())
        .pipe(gulp.dest(pkg.paths.build.css + 'theme/')))

gulp.task('css-core-sass', () => gulp.src([ pkg.paths.src.scss + '**/*.scss'])
    .pipe(sass())
    .pipe(autoprefixer())
    .pipe(minify({compatibility: 'ie9'}))
    .pipe(header(banner))
    .pipe(gulp.dest(pkg.paths.build.css)))

gulp.task('css-core-css', () => gulp.src(pkg.globs.distCss)
        .pipe(autoprefixer())
        .pipe(minify({compatibility: 'ie9'}))
        .pipe(header(banner))
        .pipe(gulp.dest(pkg.paths.dist.css)))

gulp.task('css-core', gulp.series('css-core-sass', 'css-core-css'))
gulp.task('css', gulp.parallel('css-themes', 'css-core'))

////////////////////// }}}

////////////////////// {{{ Unit testing
gulp.task('qunit', () => {

    let serverConfig = {
        root,
        port: 8009,
        host: '0.0.0.0',
        name: 'test-server'
    }

    let server = connect.server( serverConfig )

    let testFiles = glob.sync('test/*.html' )

    let totalTests = 0;
    let failingTests = 0;

    let tests = Promise.all( testFiles.map( filename => {
        return new Promise( ( resolve, reject ) => {
            qunit.runQunitPuppeteer({
                targetUrl: `http://${serverConfig.host}:${serverConfig.port}/${filename}`,
                timeout: 20000,
                redirectConsole: false,
                puppeteerArgs: ['--allow-file-access-from-files']
            })
                .then(result => {
                    if( result.stats.failed > 0 ) {
                        console.log(`${'!'} ${filename} [${result.stats.passed}/${result.stats.total}] in ${result.stats.runtime}ms`.red);
                        // qunit.printResultSummary(result, console);
                        qunit.printFailedTests(result, console);
                    }
                    else {
                        console.log(`${'✔'} ${filename} [${result.stats.passed}/${result.stats.total}] in ${result.stats.runtime}ms`.green);
                    }

                    totalTests += result.stats.total;
                    failingTests += result.stats.failed;

                    resolve();
                })
                .catch(error => {
                    console.error(error);
                    reject();
                });
        } )
    } ) );

    return new Promise( ( resolve, reject ) => {

        tests.then( () => {
                if( failingTests > 0 ) {
                    reject( new Error(`${failingTests}/${totalTests} tests failed`.red) );
                }
                else {
                    console.log(`${'✔'} Passed ${totalTests} tests`.green.bold);
                    resolve();
                }
            } )
            .catch( () => {
                reject();
            } )
            .finally( () => {
                server.close();
            } );

    } );
} )

gulp.task('eslint', () => gulp.src([ pkg.paths.src.js + '**', 'gulpfile.js'])
        .pipe(eslint())
        .pipe(eslint.format()))

gulp.task('test', gulp.series( 'eslint', 'qunit' ))
////////////////////// }}}


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

gulp.task('xlicenses', () => string_src(pkg.vars.licenses, pkg.version)
          .pipe(gulp.dest(pkg.paths.dist.base)))

gulp.task('licenses', (cb) => {
    const checker = require('license-checker')
    const treeify = require('treeify')

    checker.init({
        start: '.',
        production: true,
        development: false
    }, function(err, packages) {
        if (err) {
            //Handle error
            cb(new Error('kaboom: ' + err));
        } else {
            //The sorted package data
            //as an Object
            string_src(pkg.vars.licenses,  treeify.asTree(packages, true))
                .pipe(gulp.dest(pkg.paths.dist.base))
            cb()
        }
    });
})

gulp.task('create-build-dir', (cb) => {
        const dir = pkg.paths.build.base

        if(!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
            console.log('📁  folder created:', dir)
        }
    cb()
})

gulp.task('build-org-file-with-docker', shell.task(`docker run --rm -v $(pwd):/tmp/source ${pkg.vars.build_org_docker_local}  /root/convert-to-html.sh /tmp/source/src`))

gulp.task('build-org-file', gulp.series('create-build-dir','build-org-file-with-docker'))

gulp.task('reveal.js', () => gulp.src(["node_modules/reveal.js/**/*"])
        .pipe(gulp.dest(pkg.paths.dist.js + 'reveal.js')))

gulp.task('@hpcc-js/wasm', () => gulp.src(["node_modules/@hpcc-js/wasm/dist/**/*"])
        .pipe(gulp.dest(pkg.paths.dist.js + '@hpcc-js/wasm/dist')))

gulp.task('default', gulp.series('build-org-file','rename-files', 'reveal.js', '@hpcc-js/wasm', 'html', 'assets', gulp.parallel('js', 'css'), 'test'))

gulp.task('build', gulp.parallel('js', 'css'))

gulp.task('zip_public',  () => gulp.src(pkg.paths.dist.base + "**/*")
                                 .pipe(zip(pkg.vars.distZip))
                                 .pipe(gulp.dest('./')))

gulp.task('package', gulp.series('default', 'licenses', 'zip_public'))

gulp.task('reload', () => gulp.src([pkg.paths.src + '*.html'])
    .pipe(connect.reload()));

gulp.task('serve', () => {

    connect.server({
        root: root,
        port: port,
        host: '0.0.0.0',
        livereload: true
    })

    gulp.watch([pkg.paths.src + '*.html'], gulp.series('reload'))

    gulp.watch([pkg.paths.src.js + '**'], gulp.series('js', 'reload', 'test'))

    gulp.watch(['plugin/**/plugin.js'], gulp.series('reload'))

    gulp.watch([
        'css/theme/source/*.{sass,scss}',
        'css/theme/template/*.{sass,scss}',
    ], gulp.series('css-themes', 'reload'))

    gulp.watch([
        pkg.paths.src.css + '**/*.scss',
        pkg.paths.src.css + '**/*.css'
    ], gulp.series('css-core', 'reload'))

    gulp.watch(['test/*.html'], gulp.series('test'))

})
