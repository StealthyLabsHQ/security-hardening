'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { binaryExists, dirExists } = require('../detect');

const WINDSURF_RULES_DIR = path.join(os.homedir(), '.windsurf', 'rules');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function detect() {
  return binaryExists('windsurf') || dirExists(path.join(os.homedir(), '.windsurf'));
}

function install(skillName, content) {
  fs.mkdirSync(WINDSURF_RULES_DIR, { recursive: true });
  const dest = path.join(WINDSURF_RULES_DIR, `${skillName}.mdc`);
  fs.writeFileSync(dest, content, 'utf8');
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

module.exports = {
  name: 'windsurf',
  label: 'Windsurf',
  detect,
  install,
  installedSkills,
};
