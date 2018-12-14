#!/usr/bin/env node
'use strict';

// Requires
const {exec} = require('child_process');
const fs = require('fs');
const chokidar = require('chokidar');
const program = require('commander');
const pkg = require('./package.json');

const simpleGit = require('simple-git/promise')('.');

let ready = false;
let hasGitRepo = false;

async function checkSync() {
    let status = await simpleGit.status();
    console.log("status", status);
    if (status && status.files.length > 0) {
        try {

            console.log("");
            console.log("Syncing...");
            await simpleGit.add('.');
            await simpleGit.commit("Changes");
            let r = await simpleGit.push('origin', 'master');
            console.log("");
            console.log("Sync finished");
        }
        catch (e) {
            // handle the error
            console.error(e);
        }
    }
}

function startWathc() {

    // Start watcher
    let watcher = chokidar.watch('./', {
        ignored: /(^|[\/\\])\../,
        persistent: true,
        ignoreInitial: true
    });


    let log = console.log.bind(console);

    // Add event listeners
    watcher
        .on('add', path => notify(`File ${path} has been added`))
        .on('change', path => notify(`File ${path} has been changed`))
        .on('unlink', path => notify(`File ${path} has been removed`))
        .on('addDir', path => notify(`Directory ${path} has been added`))
        .on('unlinkDir', path => notify(`Directory ${path} has been removed`))
        .on('error', error => log(`Watcher error: ${error}`))
        .on('change', (path, stats) => {
            if (stats) console.log(`File ${path} changed size to ${stats.size}`);
        })
        // .on('raw', (event, path, details) => {
        //     log('Raw ev ent info:', event, path, details);
        // })
        .on('ready', () => {
            log('Initial scan complete. Ready for changes');
            checkGitRepo();
            ready = true;
        });
}

async function sync() {
    await checkGitRepo();
    await checkSync();
}

async function main() {
    // First Sync
    await sync();
   // startWathc();
}

async function checkGitRepo() {
    hasGitRepo = await simpleGit.checkIsRepo();
    if (!hasGitRepo)
        console.warn("This path are not a git repository yet");
    return hasGitRepo;
}


main();

return;

// program.version(pkg.version);
// program.parse(process.argv);

//
// let run = function (command) {
//     return new Promise(function (resolve, reject) {
//         exec(command, (err, stdout, stderr) => {
//             if (err) {
//                 reject(err);
//             } else {
//                 resolve(stdout, stderr);
//             }
//         });
//     });
// };

//
// let notify = function (value) {
//     console.log(value);
//     if (!ready)
//         return;
//
//     // Check for git repo
//     if (!hasGitRepo && !checkGitRepo())
//         return;
//
//     console.log("");
//     console.log("Syncing...");
//     run('git add .').then(
//         (stdout, stderr) => {
//             console.log(stdout);
//             run('git commit -m "Changes"').then(
//                 (stdout, stderr) => {
//                     console.log(stdout);
//                     run('git push origin master').then(
//                         (stdout, stderr) => {
//                             console.log(stdout);
//                             console.log("");
//                             console.log("Sync finished");
//                         }
//                     )
//                 }
//             )
//         }).catch((err) => {
//         console.log("Error running");
//         console.error(err);
//     });
// };
//

// let watchedPaths = watcher.getWatched();

process.stdin.resume();