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
    if (status && status.files.length > 0) {
        try {

            console.log("Syncing...");
            await simpleGit.add('.');
            await simpleGit.commit("Changes");
            let r = await simpleGit.push('origin', 'master');
            console.log("Sync finished successfully");
            console.log("");
        }
        catch (e) {
            console.error(e);
        }
    } else {
        console.log("Nothing to commit right now");
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
        .on('ready', () => {
            log('Initial scan complete. Watching for changes...');
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
    startWathc();
}

async function checkGitRepo() {
    hasGitRepo = await simpleGit.checkIsRepo();
    if (!hasGitRepo)
        console.warn("This path are not a git repository yet");
    return hasGitRepo;
}

async function notify(value) {
    console.log(value);
    if (!ready)
        return;

    // Check for git repo
    if (!hasGitRepo && !checkGitRepo())
        return;

    await checkSync();
}

main();

process.stdin.resume();