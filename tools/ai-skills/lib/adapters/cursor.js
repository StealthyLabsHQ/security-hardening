'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { binaryExists, dirExists } = require('../detect');
const { writeNamedSkillFile, removeNamedSkillFile } = require('../adapter-utils');

const CURSOR_RULES_DIR = path.join(os.homedir(), '.cursor', 'rules');

function detect() {
  return binaryExists('cursor') || dirExists(path.join(os.homedir(), '.cursor'));
}

function install(skillName, content) {
  writeNamedSkillFile(CURSOR_RULES_DIR, skillName, '.md', content);
}

function installedSkills() {
  try {
    return fs.readdirSync(CURSOR_RULES_DIR)
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''));
  } catch {
    return [];
  }
}

function remove(skillName) {
  removeNamedSkillFile(CURSOR_RULES_DIR, skillName, '.md');
}

module.exports = {
  name: 'cursor',
  label: 'Cursor',
  detect,
  install,
  installedSkills,
  remove,
};
