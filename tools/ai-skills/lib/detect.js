'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const HOME = os.homedir();

/**
 * Check if a binary exists in PATH.
 * @param {string} name
 * @returns {boolean}
 */
function binaryExists(name) {
  try {
    const command = process.platform === 'win32' ? 'where.exe' : 'which';
    execFileSync(command, [name], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a directory exists.
 * @param {string} dir
 * @returns {boolean}
 */
function dirExists(dir) {
  try {
    return fs.statSync(dir).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Check if a file exists.
 * @param {string} file
 * @returns {boolean}
 */
function fileExists(file) {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}

/**
 * Detect whether each AI CLI is installed on this machine.
 * Returns a map: adapterId -> boolean
 */
function detectAll() {
  return {
    claude:   binaryExists('claude')   || dirExists(path.join(HOME, '.claude')),
    codex:    binaryExists('codex')    || dirExists(path.join(HOME, '.codex')),
    gemini:   binaryExists('gemini')   || dirExists(path.join(HOME, '.gemini')),
    cursor:   binaryExists('cursor')   || dirExists(path.join(HOME, '.cursor')),
    copilot:  fileExists(path.join(process.cwd(), '.github', 'copilot-instructions.md')),
    windsurf: binaryExists('windsurf') || dirExists(path.join(HOME, '.windsurf')),
  };
}

module.exports = { detectAll, binaryExists, dirExists, fileExists };
