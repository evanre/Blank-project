var
	// global
	gulp = require('gulp'), // Gulp;
	watch = require('gulp-watch'), // Function that watching for changes in files;
	rm = require('rimraf'), // Removing files;
	browserSync = require("browser-sync"), // Local dev-server with blackjack and livereload;
	reload = browserSync.reload,
	plumber = require('gulp-plumber'), // Checks code for errors and returns its in cli;
	_if = require('gulp-if'), // Adds ternary operator features in Gulp;
	argv = require('yargs').argv, // Make possible to pass arguments in cli;
	rename = require("gulp-rename"), // // Adds file-rename functionality in Gulp;
	runSequence = require('run-sequence'), // Allows run tasks in strict sequence;
	//runSequence = require('run-sequence').use(gulp), // Variant of calling above plugin;
	gutil = require('gulp-util'),

	// Style
	prefixer = require('gulp-autoprefixer'), // Adds browser-vendor prefixes for specific css properties;
	sass = require('gulp-sass'), // Sass;
	cssmin = require('gulp-minify-css'), // Minify CSS files;
	cmq = require('gulp-combine-media-queries'), // Combine matching media queries into one media query definition;

	// js
	uglify = require('gulp-uglify'), // Minify JS files;

	// js and style
	sourcemaps = require('gulp-sourcemaps'), // Generate css and js sourscemaps, for code debug;

	// js and html
	rigger = require('gulp-rigger'), // Allows to import files one another (Like that //= footer.html);

	// image and png.sprite
	imagemin = require('gulp-imagemin'), // For compress images;

	// png.sprite
	//spritesmith = require('gulp.spritesmith'), // Generate raster sprites from png icons;

	// image
	pngquant = require('imagemin-pngquant'), // Better way to compress png files;
	newer = require('gulp-newer'), // Checks images in build folder and don't run compressing if they allready done;

	// icofont
	//iconfont = require('gulp-iconfont'), // Generate icon font from svg icons;
	//runTimestamp = Math.round(Date.now()/1000), // Delay for generaiting
	//iconfontCss = require('gulp-iconfont-css'), // Make CSS file for icon font;

	// svg.sprite
	svgSprite = require('gulp-svg-sprite');
	svgmin = require('gulp-svgmin');


/////////// How to pass keys(arguments) to cli:
// I use it with ternary operator "IF"
// Right in pipe write condition: .pipe(if(condition, then do something()))
// The condition is defined as: argv.prod, where:
// argv - Conditional name of plugin "yargs", that we named in require
// prod - key that plugin will wait for defenition in cli,
// i.e. if command pass with key --prod (e.g.: gulp build --prod),
// Then condition is true, if nothing was passed or something another then false.
// e.g.: .pipe(_if(!argv.prod, sourcemaps.init()))

var path = {
	src: {
		html: 'src/*.html', // Syntax src/*.html speaks Gulp that we want take all files with .html extension in root of the src folder;
		php: 'src/php/**/*.php',
		style: 'src/style/style.scss',// In styles folder we needed only Main file;
		js: 'src/js/*.js',
		font: {
			fonts: ['src/fonts/**/*.*', '!src/fonts/icofont/**'], // Exception in the img folder: icofont;
			icofont: {
				path: ['src/fonts/icofont/**/*.svg'],
				base: {base: 'src/fonts'},
				style: '../../../src/style/modules', // Path where we put ready files;
				fontVar: '../fonts/icofont/', // Path variable to font files for styles;
				template: 'src/assets/icofont-style-template.scss' // Template for icon font styles file;
			}
		},
		img: {
			img: ['src/img/**/*.*', '!src/img/sprite/**'], // Syntax src/img/**/*.* speaks Gulp to take all files all extensions in all child folders, except - files in sprite folder;
			sprite: {
				png: {
					src: 'src/img/sprite/png/**/*.*',// Same as the pictures above;
					style: 'src/style/partials/modules', // Path where putting sprite styles file;
					template: 'src/assets/sprite.template.mustache', // Template for sprite styles file;
					imgName: 'sprite.png',
					cssName: 'sprite.scss',
				},
				svg: {
					src: 'src/img/sprite/svg/**/*.svg',// Same as the pictures above;
					style: 'src/style/partials/modules',
					template: 'src/assets/svgSpriteTemplate.scss', // Template for sprite styles file;
					imgName: 'sprite.svg',
					cssName: 'sprite.scss',
				},
			},
		},
	},
	build: {
		html: 'build/',
		php: 'build/',
		js: 'build/js',
		css: 'build/css',
		img: {
			img: 'build/img',
			sprite: 'build/img/ui', // Both sprite types - png and svg;
		},
		font: {
			fonts: 'build/fonts/',
			icofont: 'build/fonts/icofont/',
		}
	},
	watch: {
		html: 'src/**/*.html',
		php: 'src/php/**/*.php',
		js: 'src/js/**/*.js',
		style: 'src/style/**/*.scss',
		img: 'src/img/**/*.*',
		sprite: 'src/img/sprite/**/*.*',
		fonts: 'src/fonts/**/*.*',
	},
	assets: {
		bower: {
			src: 'bower_components/**/*.css', // Select all files with .css extension in Bower folder;
			build: 'bower_components/',
		},
		server: './build',
	},
	clean: './build/*' // build folder for cleaning;
};

function swallowError (error) {
	console.log(error.toString());
	this.emit('end');
}

gulp.task('php:build', function () { // Build PHP;
	return gulp.src(path.src.php) // Collect all php files;
		.pipe(plumber()) // Watch for errors;
		.pipe(gulp.dest(path.build.php)) // Put into build;
		.pipe(reload({stream: true})); // Reload server
});

gulp.task('html:build', function () { // Build HTML;
	return gulp.src(path.src.html) // Collect all html files;
		.pipe(plumber()) // Watch for errors;
		.pipe(rigger()) // Check it in rigger;
		.pipe(gulp.dest(path.build.html)) // Put into build;
		.pipe(reload({stream: true})); // Reload server;
});

gulp.task('js:build', function () { // Compile JavaScript;
	return gulp.src(path.src.js) // Collect our main.js;
		.pipe(plumber()) // Watch for errors;
		.on('error', swallowError)
		.pipe(rigger()) // Including files;
		.pipe(_if(!argv.prod, sourcemaps.init())) // If NOT production, initialize sorcemaps;
		.pipe(_if(argv.prod, uglify())) // If production, minify js files;
		.pipe(_if(!argv.prod, sourcemaps.write())) // If NOT production, write sorcemaps;
		.pipe(gulp.dest(path.build.js)) // Put into build;
		.pipe(reload({stream: true})); // Reload server;
});

gulp.task('style:build', function () { // Compile CSS;
	return gulp.src(path.src.style) // Collect our main.scss;
		.pipe(plumber()) // Watch for errors;
		.pipe(_if(!argv.prod, sourcemaps.init())) // If NOT production, initialize sorcemaps;
		.pipe(sass()) // Compile SASS;
		.on('error', swallowError)
		.pipe(cmq()) // Combine matching media queries into one media query definition;
		.pipe(_if(argv.prod, prefixer({ browsers: ['last 3 versions'], cascade: false }))) // If production, autoprefix it;
		.pipe(_if(argv.prod, cssmin())) // if production, minify styles;
		.pipe(_if(!argv.prod, sourcemaps.write())) // if NOT production, write sorcemaps;
		.pipe(gulp.dest(path.build.css)) // Put into build;
		.pipe(reload({stream: true})); // Reload server;
});

gulp.task('image:build', function () { // Copy and minify pictures;
	return gulp.src(path.src.img.img) // Verifies pictures for only pass through newer source files;
		.pipe(newer(path.build.img.img)) // Check images in build folder
		.pipe(_if(argv.prod, imagemin({ // Minify them;
			progressive: true,
			svgoPlugins: [{removeViewBox: false}],
			use: [pngquant()],
			interlaced: true
		})))
		.pipe(gulp.dest(path.build.img.img)) // Put into build;
		.pipe(reload({stream: true})); // Reload server;
});

gulp.task('pngSprite:build', function () { // Generate PNG sprite;
	var spriteData = gulp.src(path.src.img.sprite.png.src) // Collect pictures for sprite;
		.pipe(spritesmith({
			imgName: path.src.img.sprite.png.imgName, // Generaiting sprite file name;
			cssName: path.src.img.sprite.png.cssName, // Generaiting style file name;
			algorithm: 'top-down', // Algorithm for generaiting sprite;
			cssFormat: 'scss', // Generaiting style file format;
			cssTemplate: path.src.img.sprite.png.template, // Template for generaiting style file;
			cssVarMap: function(sprite) {
				sprite.name = 's-' + sprite.name; // Set prefix for varibales;
			}
		}));
		spriteData.img
			//.pipe(_if(argv.prod,imagemin())) // If production, compress sprite;
			.pipe(gulp.dest(path.build.img.sprite)); // Path for generated sprite.png;
		return spriteData.css
			.pipe(gulp.dest(path.src.img.sprite.png.style)); // Path for generated style file;
			//.pipe(reload({stream: true}));
});

gulp.task('svgSprite:build', function () { // Generate SVG sprite;
	return gulp.src(path.src.img.sprite.svg.src)
		.pipe(svgmin())
		.pipe(svgSprite({
			shape: {
				id: {
					generator: "svg-%s",
				},
				dimension: {// Set maximum dimensions;
					maxWidth: 32,
					maxHeight: 32,
					attributes  : false,
				},
				spacing: {// Add paddings;
					padding: 0,
				},
			},
			mode: {
				/*css: {
					dest: "build/img/ui",
					layout: "diagonal",
					sprite: "sprite.svg",
					bust: false,
					render: {
						scss: {
							dest: '../../../src/style/modules/svg-sprite.scss',
							template: 'src/assets/svgSpriteTemplate.scss',
						},
					},
					example: true,
				},*/
				symbol: { // Activate the «symbol» mode;
					dest: ".",
					//layout: "diagonal",
					sprite: path.src.img.sprite.svg.imgName,
					dimensions: "", // default "-dims"
					bust: false,
					example: true,
					prefix: ".%s", // Prefix for properties of svg tag (dims);
				},
			},
			/*variables: {
				mapname: "icons"
			}*/
		}))
		.pipe(gulp.dest(path.build.img.sprite)) // Put into build;
		.pipe(reload({stream: true})); // Reload server;
});

gulp.task('icofont:build', function() { // Generate iconfont and style file for it;
	return gulp.src(path.src.font.icofont.src, path.src.font.icofont.base)
	.pipe(iconfontCss({ // create style file
		fontName: 'icofont', // Required, font name, same like in inconfont part;
		path: path.src.font.icofont.template, // Template for generaiting style file;
		targetPath: path.src.font.icofont.style + '/icofont.scss', // Path and name for genearated style file;
		fontPath: path.src.font.icofont.fontVar // Path variable to font files for styles;
	}))
	.pipe(iconfont({ // Create fonts;
		fontName: 'icofont', // Required, font name;
		appendUnicode: true, // Recommended option;
		formats: ['woff', 'woff2'], // Default, 'ttf', 'eot', 'woff', 'woff2' and 'svg' are available;
		normalize: true,
		fontHeight: 1001,
		timestamp: runTimestamp, // Recommended to get consistent builds when watching files;
	}))
	.pipe(gulp.dest(path.build.font.icofont)); // Put generated fonts into build folder;
});

gulp.task('fonts:build', function() { // Copying fonts;
	return gulp.src(path.src.font.fonts)
		.pipe(gulp.dest(path.build.font.fonts));
});

gulp.task('build', function(cb) {
	runSequence(
		//'icofont:build',
		//'pngSprite:build',
		'svgSprite:build',
		[
			//'html:build',
			'php:build',
			'js:build',
			'style:build',
			'fonts:build',
			'image:build',
		],
	cb);
});

gulp.task('watch', function(){ // Watch for file changes;
	//watch([path.watch.html], function(event, cb) {gulp.start('html:build');});
	watch([path.watch.php], function(event, cb) {gulp.start('php:build');});
	watch([path.watch.style], function(event, cb) {gulp.start('style:build');});
	watch([path.watch.js], function(event, cb) {gulp.start('js:build');});
	watch([path.watch.img], function(event, cb) {gulp.start('image:build');});
	//watch([path.watch.fonts], function(event, cb) {gulp.start('fonts:build');gulp.start('icofont:build');});
	watch([path.watch.fonts], function(event, cb) {gulp.start('fonts:build');});
	//watch([path.watch.sprite], function(event, cb) {gulp.start('pngSprite:build');gulp.start('svgSprite:build');});
	watch([path.watch.sprite], function(event, cb) {gulp.start('svgSprite:build');});
});

gulp.task('webserver', function () { // Start local web server;
	browserSync({
		//server: {baseDir: "./build"}, // If we already have dev server;
		proxy: "truecourse.dev", // Proxying to existing dev server domain;
		//tunnel: true,
		host: 'localhost',
		port: 9000,
		logPrefix: "Frontend_Evanre_Log"
	});
});

gulp.task('clean', function (cb) { // Delete build folder content;
	rm(path.clean, cb);
});

gulp.task('bower-css', function () { // Double css files with .scss;
	gulp.src(path.assets.bower.src) // Find all css files in bower's folder;
	.pipe(rename({
		extname: ".scss" // Copy this files with .scss extention;
	}))
	.pipe(gulp.dest(path.assets.bower.build)); // Save them in the same folder;
});

gulp.task('clean-build', function(cb) {
	runSequence('clean','build', cb);
});

gulp.task('clean-sprite', function(cb) {
	runSequence('clean','svgSprite:build', cb);
});

gulp.task('build-watch', ['build', 'watch']);

gulp.task('default', function(cb) {
	runSequence('build', 'webserver', 'watch', cb);
});
