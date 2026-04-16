'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { binaryExists, dirExists } = require('../detect');
const {
  upsertNamedSection,
  removeNamedSection,
  listSectionNames,
  writeFileAtomic,
} = require('../adapter-utils');

const CODEX_DIR = path.join(os.homedir(), '.codex');
const AGENTS_FILE = path.join(CODEX_DIR, 'AGENTS.md');
const LEGACY_INSTRUCTIONS_FILE = path.join(CODEX_DIR, 'instructions.md');

function detect() {
  return binaryExists('codex') || dirExists(CODEX_DIR);
}

function migrateLegacyFile() {
  fs.mkdirSync(CODEX_DIR, { recursive: true });

  if (!fs.existsSync(LEGACY_INSTRUCTIONS_FILE) || fs.existsSync(AGENTS_FILE)) {
    return;
  }

  const legacyContent = fs.readFileSync(LEGACY_INSTRUCTIONS_FILE, 'utf8');
  writeFileAtomic(AGENTS_FILE, legacyContent);
  fs.rmSync(LEGACY_INSTRUCTIONS_FILE, { force: true });
}

function install(skillName, content) {
  migrateLegacyFile();
  upsertNamedSection(AGENTS_FILE, skillName, content);
}

function installedSkills() {
  migrateLegacyFile();
  return listSectionNames(AGENTS_FILE);
}

function remove(skillName) {
  removeNamedSection(AGENTS_FILE, skillName);
  removeNamedSection(LEGACY_INSTRUCTIONS_FILE, skillName);
}

module.exports = {
  name: 'codex',
  label: 'OpenAI Codex CLI',
  detect,
  install,
  installedSkills,
  remove,
};
