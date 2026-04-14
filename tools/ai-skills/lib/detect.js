'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const HOME = os.homedir();

/**
 * Check if a binary exists in PATH.
 * @param {string} name
 * @returns {boolean}
 */
function binaryExists(name) {
  try {
    const cmd = process.platform === 'win32'
      ? `where ${name} 2>nul`
      : `command -v ${name} 2>/dev/null`;
    execSync(cmd, { stdio: 'pipe' });
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
 * Detect whether each AI CLI is installed on this machine.
 * Returns a map: adapterId -> boolean
 */
function detectAll() {
  return {
    claude:   binaryExists('claude')   || dirExists(path.join(HOME, '.claude')),
    codex:    binaryExists('codex')    || dirExists(path.join(HOME, '.codex')),
    gemini:   binaryExists('gemini')   || dirExists(path.join(HOME, '.gemini')),
    cursor:   binaryExists('cursor')   || dirExists(path.join(HOME, '.cursor')),
    copilot:  binaryExists('gh')       || dirExists(path.join(HOME, '.config', 'gh')),
    windsurf: binaryExists('windsurf') || dirExists(path.join(HOME, '.windsurf')),
  };
}

module.exports = { detectAll, binaryExists, dirExists };
