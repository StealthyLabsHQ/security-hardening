'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { binaryExists, dirExists } = require('../detect');

const CODEX_DIR = path.join(os.homedir(), '.codex');
const INSTRUCTIONS_FILE = path.join(CODEX_DIR, 'instructions.md');

const SECTION_MARKER = (name) => `## ${name}`;

function detect() {
  return binaryExists('codex') || dirExists(CODEX_DIR);
}

function install(skillName, content) {
  fs.mkdirSync(CODEX_DIR, { recursive: true });
  const section = `${SECTION_MARKER(skillName)}\n\n${content}\n`;
  if (fs.existsSync(INSTRUCTIONS_FILE)) {
    const existing = fs.readFileSync(INSTRUCTIONS_FILE, 'utf8');
    // Replace existing section if present, otherwise append
    const sectionRe = new RegExp(`## ${escapeRegex(skillName)}[\\s\\S]*?(?=\\n## |$)`, 'g');
    if (sectionRe.test(existing)) {
      fs.writeFileSync(INSTRUCTIONS_FILE, existing.replace(sectionRe, section.trimEnd()), 'utf8');
    } else {
      fs.appendFileSync(INSTRUCTIONS_FILE, `\n${section}`, 'utf8');
    }
  } else {
    fs.writeFileSync(INSTRUCTIONS_FILE, section, 'utf8');
  }
}

function installedSkills() {
  try {
    const content = fs.readFileSync(INSTRUCTIONS_FILE, 'utf8');
    const matches = content.match(/^## (.+)$/gm) || [];
    return matches.map((m) => m.replace(/^## /, ''));
  } catch {
    return [];
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  name: 'codex',
  label: 'OpenAI Codex CLI',
  detect,
  install,
  installedSkills,
};
