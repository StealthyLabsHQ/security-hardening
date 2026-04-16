'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { binaryExists, dirExists } = require('../detect');
const { writeNamedSkillFile, removeNamedSkillFile } = require('../adapter-utils');

const WINDSURF_RULES_DIR = path.join(os.homedir(), '.windsurf', 'rules');

function detect() {
  return binaryExists('windsurf') || dirExists(path.join(os.homedir(), '.windsurf'));
}

function install(skillName, content) {
  writeNamedSkillFile(WINDSURF_RULES_DIR, skillName, '.mdc', content);
}

function installedSkills() {
  try {
    return fs.readdirSync(WINDSURF_RULES_DIR)
      .filter((f) => f.endsWith('.mdc'))
      .map((f) => f.replace(/\.mdc$/, ''));
  } catch {
    return [];
  }
}

function remove(skillName) {
  removeNamedSkillFile(WINDSURF_RULES_DIR, skillName, '.mdc');
}

module.exports = {
  name: 'windsurf',
  label: 'Windsurf',
  detect,
  install,
  installedSkills,
  remove,
};
