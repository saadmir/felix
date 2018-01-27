const path = require('path');
const gulp = require('gulp');
const del = require('del');
const ts = require('gulp-typescript');
const spawn = require('child_process').spawn;
const nodemon = require('gulp-nodemon');
const tslint = require('gulp-tslint');
const runSequence = require('run-sequence');
const browserSync = require('browser-sync').create();
const reload      = browserSync.reload;

const serverConfig = require('./tsconfig.json');
const serverOutput = serverConfig.compilerOptions.outDir;
const serverProject = ts.createProject('tsconfig.json');

const frontend = path.resolve(__dirname,'frontend');
const frontendOutput = path.resolve(__dirname, serverOutput,'public');

gulp.task('tslint', () => {
  const configuration = { configuration: './tslint.json' };
  serverProject.src().pipe(tslint(configuration)).pipe(tslint.report());
});

gulp.task('clean-server',   () => del([serverOutput]));
gulp.task('clean-frontend', () => del([frontendOutput]));
gulp.task('clean', ['clean-frontend', 'clean-server']);

gulp.task('build-server', () => serverProject.src().pipe(serverProject()).js.pipe(gulp.dest(serverOutput)));
gulp.task('build-server-prod', () => {
  const tsProject = ts.createProject('tsconfig.json', { sourceMap: false });
  tsProject.src().pipe(tsProject()).js.pipe(gulp.dest(serverOutput));
});

// runs npm install in frontend directory
gulp.task('install-frontend', (cb) => spawn('npm', ['install'], { cwd: frontend, stdio: 'inherit', shell: true }).on('close', cb));

// run frontend with --watch flag to watch file changes and rebuild if necessary
gulp.task('build-frontend',       (cb) => spawn('./node_modules/.bin/ng', `build --output-path ${frontendOutput}`.split(' '), { cwd: frontend, stdio: 'inherit', shell: true }).on('close', cb));
gulp.task('build-frontend-watch', (cb) => spawn('./node_modules/.bin/ng', `build -w -dop false --output-path ${frontendOutput}`.split(' '), { cwd: frontend, stdio: 'inherit', shell: true }).on('close', cb));
gulp.task('build-frontend-prod',  (cb) => spawn('./node_modules/.bin/ng', `build --prod --aot true --no-sourcemap --build-optimizer --verbose false --progress false --output-path ${frontendOutput}`.split(' '), { cwd: frontend, stdio: 'inherit', shell: true }).on('close', cb));

gulp.task('build',      ['clean'], (cb) => runSequence('build-server', 'build-frontend', cb));
gulp.task('build-prod', ['clean'], (cb) => runSequence('build-server-prod', 'build-frontend-prod', cb));

// setup browserSync to watch and reload when frontend changes
gulp.task('init-browser-sync', () => {
  return browserSync.init({
    port: 3001,
    open: false,
    files: [`${frontendOutput}/**/*`],
    reloadDebounce: 1000,
    proxy: 'localhost:3030'
  });
})

gulp.task('watch-frontend', (cb) => runSequence('init-browser-sync', 'build-frontend-watch', cb));
gulp.task('watch-server', () => {
  return nodemon({
    script: path.resolve(serverOutput, 'server.js'),
    verbose: false,
    watch: serverConfig.include,
    ext: 'ts',
    tasks: ['build-server'],
    env: { 'NODE_ENV': 'development' }
  }).on('restart', () => reload());
});

// gulp.task('watch', (cb) => runSequence('build-server', 'build-frontend', 'watch-server', 'init-browser-sync', 'build-frontend-watch', cb));
gulp.task('watch', ['clean'], () => runSequence('build-server', 'watch-server'));

gulp.task('nodemon',() => nodemon({
  script: path.resolve(serverOutput, 'server.js'),
  verbose: false,
  env: { 'NODE_ENV': 'production' },
  watch: false
}));

// used for deployment to prod/staging, do not use for development
// gulp.task('serve', ['clean'], (cb) => runSequence('build-server-prod', 'build-frontend-prod', 'nodemon', cb));
gulp.task('serve', ['clean'], (cb) => runSequence('build-server', 'nodemon', cb));

gulp.task('default', ['build']);