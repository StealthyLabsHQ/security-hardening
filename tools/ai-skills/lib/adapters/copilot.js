'use strict';

const fs = require('fs');
const path = require('path');
const { upsertNamedSection, removeNamedSection, listSectionNames } = require('../adapter-utils');

// Copilot instructions live in the repo, not home dir
const COPILOT_FILE = path.join(process.cwd(), '.github', 'copilot-instructions.md');
const GITHUB_DIR = path.join(process.cwd(), '.github');

function detect() {
  return fs.existsSync(COPILOT_FILE);
}

function install(skillName, content) {
  fs.mkdirSync(GITHUB_DIR, { recursive: true });
  upsertNamedSection(COPILOT_FILE, skillName, content);
}

function installedSkills() {
  return listSectionNames(COPILOT_FILE);
}

function remove(skillName) {
  removeNamedSection(COPILOT_FILE, skillName);
}

module.exports = {
  name: 'copilot',
  label: 'GitHub Copilot',
  detect,
  install,
  installedSkills,
  remove,
};
