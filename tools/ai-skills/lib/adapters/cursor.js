'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { binaryExists, dirExists } = require('../detect');

const CURSOR_RULES_DIR = path.join(os.homedir(), '.cursor', 'rules');

function detect() {
  return binaryExists('cursor') || dirExists(path.join(os.homedir(), '.cursor'));
}

function install(skillName, content) {
  fs.mkdirSync(CURSOR_RULES_DIR, { recursive: true });
  const dest = path.join(CURSOR_RULES_DIR, `${skillName}.md`);
  fs.writeFileSync(dest, content, 'utf8');
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
  const dest = path.join(CURSOR_RULES_DIR, `${skillName}.md`);
  if (fs.existsSync(dest)) {
    fs.unlinkSync(dest);
  }
}

module.exports = {
  name: 'cursor',
  label: 'Cursor',
  detect,
  install,
  installedSkills,
  remove,
};
