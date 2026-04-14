'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { binaryExists, dirExists } = require('../detect');

// Copilot instructions live in the repo, not home dir
const COPILOT_FILE = path.join(process.cwd(), '.github', 'copilot-instructions.md');
const GITHUB_DIR = path.join(process.cwd(), '.github');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function detect() {
  return binaryExists('gh') || dirExists(path.join(os.homedir(), '.config', 'gh'));
}

function install(skillName, content) {
  fs.mkdirSync(GITHUB_DIR, { recursive: true });
  const section = `## ${skillName}\n\n${content}\n`;
  if (fs.existsSync(COPILOT_FILE)) {
    const existing = fs.readFileSync(COPILOT_FILE, 'utf8');
    const sectionRe = new RegExp(`## ${escapeRegex(skillName)}[\\s\\S]*?(?=\\n## |$)`, 'g');
    if (sectionRe.test(existing)) {
      fs.writeFileSync(COPILOT_FILE, existing.replace(sectionRe, section.trimEnd()), 'utf8');
    } else {
      fs.appendFileSync(COPILOT_FILE, `\n${section}`, 'utf8');
    }
  } else {
    fs.writeFileSync(COPILOT_FILE, section, 'utf8');
  }
}

function installedSkills() {
  try {
    const content = fs.readFileSync(COPILOT_FILE, 'utf8');
    const matches = content.match(/^## (.+)$/gm) || [];
    return matches.map((m) => m.replace(/^## /, ''));
  } catch {
    return [];
  }
}

function remove(skillName) {
  if (!fs.existsSync(COPILOT_FILE)) return;
  const content = fs.readFileSync(COPILOT_FILE, 'utf8');
  const sectionRe = new RegExp(
    `\\n?## ${escapeRegex(skillName)}[\\s\\S]*?(?=\\n## |$)`,
    'g'
  );
  const updated = content.replace(sectionRe, '');
  fs.writeFileSync(COPILOT_FILE, updated, 'utf8');
}

module.exports = {
  name: 'copilot',
  label: 'GitHub Copilot',
  detect,
  install,
  installedSkills,
  remove,
};
