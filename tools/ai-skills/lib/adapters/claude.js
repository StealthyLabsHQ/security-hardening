'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { dirExists } = require('../detect');

const SKILLS_DIR = path.join(os.homedir(), '.claude', 'skills');

function detect() {
  return dirExists(path.join(os.homedir(), '.claude'));
}

function install(skillName, content) {
  fs.mkdirSync(SKILLS_DIR, { recursive: true });
  const dest = path.join(SKILLS_DIR, `${skillName}.md`);
  fs.writeFileSync(dest, content, 'utf8');
}

function installedSkills() {
  try {
    return fs.readdirSync(SKILLS_DIR)
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''));
  } catch {
    return [];
  }
}

function remove(skillName) {
  const dest = path.join(SKILLS_DIR, `${skillName}.md`);
  if (fs.existsSync(dest)) {
    fs.unlinkSync(dest);
  }
}

module.exports = {
  name: 'claude',
  label: 'Claude Code',
  detect,
  install,
  installedSkills,
  remove,
};
