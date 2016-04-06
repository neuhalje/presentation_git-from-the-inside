// vim:  set syntax=javaScript foldmethod=indent  foldlevel=2 :

module.exports = function(grunt) {
        "use strict";

        // Project configuration.
        grunt.initConfig({
                pkg: grunt.file.readJSON('package.json'),
                watch: {
                        files: '<config:lint.files>',
                        tasks: 'default'
                },
                clean: {
                        folder: [ "output", "tmp" ]
                },
                copy: {
                        html: {
                                files:  [
                                                {  cwd: 'src/html', src: 'index.html',  dest: 'output/', expand: true },
                                        ],
                        },
                        css: {
                                files:  [
                                                {  cwd: 'src/css', src: 'impress-demo.css',  dest: 'output/', expand: true },
                                        ],
                        },
                        impress: {
                                files:  [
                                                {  cwd: 'src/js', src: 'impress.js',  dest: 'output/', expand: true },
                                        ],
                        },
                        images: {
                                files:  [
                                                {  cwd: 'src/img', src: '**',  dest: 'output/img/', expand: true },
                                        ],
                        },
                },
                embed: {
                    options: {
                      threshold: '10240KB', /* Embedd EVERYTHING */
                      assetRoot: 'output'
                    },
                    html: {
                      files: {
                        "output/index.html" : "src/html/index.html"
                      }
                    }
                },
                svgmin: {
                        options: {
                            plugins: [
                                { removeViewBox: false },
                                { removeEditorsNSData: true },
                                { removeMetadata: true },
                                { removeUselessStrokeAndFill: true },
                                { removeEmptyContainers: true },
                                { removeHiddenElems: true },
                                { convertPathData: true },
                                { collapseGroups: true },
                                { removeDimensions: false },
                                { removeXMLProcInst: false },
                                //{ removeAttrs: { attrs: ['xmlns'] } }
                            ]
                        },
                        dist: {
                                files: [{
                                        expand: true,
                                        cwd: 'src/svg',
                                        src: ['*.svg'],
                                        dest: 'tmp/svg-svgmin'
                                }]
                        }
                },
                grunticon: {
                        slides: {
                                files: [{
                                        expand: true,
                                        cwd: 'tmp/svg-svgmin',
                                        src: ['**/*.svg', '**/*.png'],
                                        dest: "output"
                                }],
                                options: {

                                        // CSS filenames
                                        datasvgcss: "icons.data.svg.css",
                                        datapngcss: "icons.data.png.css",
                                        urlpngcss: "icons.fallback.css",

                                        // preview HTML filename
                                        previewhtml: "preview.html",

                                        // grunticon loader code snippet filename
                                        loadersnippet: "grunticon.loader.js",

                                        // Include loader code for SVG markup embedding
                                        enhanceSVG: true,

                                        // Make markup embedding work across domains (if CSS hosted externally)
                                        corsEmbed: false,

                                        // folder name (within dest) for png output
                                        pngfolder: "png",

                                        // prefix for CSS classnames
                                        cssprefix: ".slide-",

                                        defaultWidth: "800px",
                                        defaultHeight: "600px",

                                        // css file path prefix - this defaults to "/" and will be placed before the "dest" path when stylesheets are loaded.
                                        // This allows root-relative referencing of the CSS. If you don't want a prefix path, set to to ""
                                        cssbasepath: "/",

                                        compressPNG: false
                                }
                        }
                },
        });

        grunt.loadNpmTasks('grunt-contrib-clean');
        grunt.loadNpmTasks('grunt-contrib-copy');
        grunt.loadNpmTasks('grunt-grunticon');
        grunt.loadNpmTasks('grunt-svgmin');
        grunt.loadNpmTasks('grunt-embed');

        grunt.registerTask('default', ['svgmin', 'grunticon:slides', 'copy:css', 'copy:impress', 'copy:images', 'embed:html']);
        grunt.registerTask('no_embedd', ['svgmin', 'grunticon:slides', 'copy:css', 'copy:impress','copy:images', 'copy:html']);
};
