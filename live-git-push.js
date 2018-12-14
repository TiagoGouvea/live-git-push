#!/usr/bin/env node
'use strict';

// Requires
const {exec} = require('child_process');
var chokidar = require('chokidar');

// Start watcher
var watcher = chokidar.watch('./', {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true
});

var ready = false;

var run = function (command) {
    return new Promise(function (resolve, reject) {
        exec(command, (err, stdout, stderr) => {
            if (err) {
                reject(err);
            } else {
                resolve(stdout, stderr);
            }
        });
    });
};

var notify = function (value) {
    console.log(value);
    if (!ready)
        return;

    console.log("");
    console.log("Syncing...");
    run('git add .').then(
        (stdout, stderr) => {
            console.log(stdout);
            run('git commit -m "Changes"').then(
                (stdout, stderr) => {
                    console.log(stdout);
                    run('git push origin master').then(
                        (stdout, stderr) => {
                            console.log(stdout);
                            console.log("");
                            console.log("Sync finished");
                        }
                    )
                }
            )
        }).catch((err)=>{
            console.log("Error running");
            console.error(err);
    });
};

var log = console.log.bind(console);

// Add event listeners.
watcher
    .on('add', path => notify(`File ${path} has been added`))
    .on('change', path => notify(`File ${path} has been changed`))
    .on('unlink', path => notify(`File ${path} has been removed`))
    .on('addDir', path => notify(`Directory ${path} has been added`))
    .on('unlinkDir', path => notify(`Directory ${path} has been removed`))
    .on('error', error => notify(`Watcher error: ${error}`))
    .on('change', (path, stats) => {
        if (stats) console.log(`File ${path} changed size to ${stats.size}`);
    })
    // .on('raw', (event, path, details) => {
    //     log('Raw ev ent info:', event, path, details);
    // })
    .on('ready', () => {
        log('Initial scan complete. Ready for changes');
        ready = true;
    });


/// Get list of actual paths being watched on the filesystem
var watchedPaths = watcher.getWatched();

// Stop watching.
// watcher.close();