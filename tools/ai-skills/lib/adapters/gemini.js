'use strict';

const path = require('path');
const os = require('os');
const { binaryExists, dirExists } = require('../detect');
const { upsertNamedSection, removeNamedSection, listSectionNames } = require('../adapter-utils');

const GEMINI_DIR = path.join(os.homedir(), '.gemini');
const GEMINI_FILE = path.join(GEMINI_DIR, 'GEMINI.md');

function detect() {
  return binaryExists('gemini') || dirExists(GEMINI_DIR);
}

function install(skillName, content) {
  upsertNamedSection(GEMINI_FILE, skillName, content);
}

function installedSkills() {
  return listSectionNames(GEMINI_FILE);
}

function remove(skillName) {
  removeNamedSection(GEMINI_FILE, skillName);
}

module.exports = {
  name: 'gemini',
  label: 'Gemini CLI',
  detect,
  install,
  installedSkills,
  remove,
};
