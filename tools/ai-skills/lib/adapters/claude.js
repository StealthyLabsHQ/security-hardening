'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { dirExists } = require('../detect');
const { writeNamedSkillFile, removeNamedSkillFile } = require('../adapter-utils');

const SKILLS_DIR = path.join(os.homedir(), '.claude', 'skills');

function detect() {
  return dirExists(path.join(os.homedir(), '.claude'));
}

function install(skillName, content) {
  writeNamedSkillFile(SKILLS_DIR, skillName, '.md', content);
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
  removeNamedSkillFile(SKILLS_DIR, skillName, '.md');
}

module.exports = {
  name: 'claude',
  label: 'Claude Code',
  detect,
  install,
  installedSkills,
  remove,
};
