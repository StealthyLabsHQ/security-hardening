'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { binaryExists, dirExists } = require('../detect');

const GEMINI_DIR = path.join(os.homedir(), '.gemini');
const GEMINI_FILE = path.join(GEMINI_DIR, 'GEMINI.md');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function detect() {
  return binaryExists('gemini') || dirExists(GEMINI_DIR);
}

function install(skillName, content) {
  fs.mkdirSync(GEMINI_DIR, { recursive: true });
  const section = `## ${skillName}\n\n${content}\n`;
  if (fs.existsSync(GEMINI_FILE)) {
    const existing = fs.readFileSync(GEMINI_FILE, 'utf8');
    const sectionRe = new RegExp(`## ${escapeRegex(skillName)}[\\s\\S]*?(?=\\n## |$)`, 'g');
    if (sectionRe.test(existing)) {
      fs.writeFileSync(GEMINI_FILE, existing.replace(sectionRe, section.trimEnd()), 'utf8');
    } else {
      fs.appendFileSync(GEMINI_FILE, `\n${section}`, 'utf8');
    }
  } else {
    fs.writeFileSync(GEMINI_FILE, section, 'utf8');
  }
}

function installedSkills() {
  try {
    const content = fs.readFileSync(GEMINI_FILE, 'utf8');
    const matches = content.match(/^## (.+)$/gm) || [];
    return matches.map((m) => m.replace(/^## /, ''));
  } catch {
    return [];
  }
}

module.exports = {
  name: 'gemini',
  label: 'Gemini CLI',
  detect,
  install,
  installedSkills,
};
