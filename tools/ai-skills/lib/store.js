'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const STORE_DIR = path.join(os.homedir(), '.ai-skill');
const STORE_FILE = path.join(STORE_DIR, 'installed.json');

/**
 * Load the installed-skills store from disk (returns {} if missing/corrupt).
 * @returns {object}
 */
function load() {
  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Persist the store to disk.
 * @param {object} data
 */
function save(data) {
  fs.mkdirSync(STORE_DIR, { recursive: true });
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Record (add or update) an installed skill.
 * @param {string}   skillName
 * @param {string}   source      e.g. "StealthyLabsHQ/security-hardening"
 * @param {string}   branch      e.g. "main"
 * @param {string[]} adapterIds  e.g. ["claude", "codex"]
 */
function record(skillName, source, branch, adapterIds) {
  const data = load();
  data[skillName] = {
    source,
    branch,
    installedAt: new Date().toISOString(),
    adapters: adapterIds,
  };
  save(data);
}

/**
 * Remove a skill from the store.
 * @param {string} skillName
 */
function unrecord(skillName) {
  const data = load();
  delete data[skillName];
  save(data);
}

/**
 * Return all installed-skill entries.
 * @returns {object}
 */
function getAll() {
  return load();
}

/**
 * Return a single entry or null.
 * @param {string} skillName
 * @returns {object|null}
 */
function get(skillName) {
  return load()[skillName] || null;
}

module.exports = { record, unrecord, getAll, get };
