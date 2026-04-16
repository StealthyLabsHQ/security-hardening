'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { validateSkillName } = require('./validation');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function writeFileAtomic(filePath, content) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });

  const tmpPath = path.join(
    dir,
    `.${path.basename(filePath)}.${process.pid}.${crypto.randomUUID()}.tmp`
  );

  fs.writeFileSync(tmpPath, content, 'utf8');

  try {
    if (process.platform === 'win32' && fs.existsSync(filePath)) {
      fs.rmSync(filePath, { force: true });
    }
    fs.renameSync(tmpPath, filePath);
  } finally {
    if (fs.existsSync(tmpPath)) {
      fs.rmSync(tmpPath, { force: true });
    }
  }
}

function buildSkillFilePath(baseDir, skillName, extension) {
  validateSkillName(skillName);
  return path.join(baseDir, `${skillName}${extension}`);
}

function writeNamedSkillFile(baseDir, skillName, extension, content) {
  const filePath = buildSkillFilePath(baseDir, skillName, extension);
  writeFileAtomic(filePath, content);
}

function removeNamedSkillFile(baseDir, skillName, extension) {
  const filePath = buildSkillFilePath(baseDir, skillName, extension);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

function listSectionNames(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = content.match(/^## (.+)$/gm) || [];
    return matches.map((match) => match.replace(/^## /, ''));
  } catch {
    return [];
  }
}

function upsertNamedSection(filePath, skillName, content) {
  validateSkillName(skillName);

  const section = `## ${skillName}\n\n${String(content).trimEnd()}\n`;
  const sectionRe = new RegExp(`(^|\\n)## ${escapeRegex(skillName)}[\\s\\S]*?(?=\\n## |$)`, 'g');

  let updated = section;
  if (fs.existsSync(filePath)) {
    const existing = fs.readFileSync(filePath, 'utf8');
    if (sectionRe.test(existing)) {
      updated = existing.replace(sectionRe, (match, prefix) => `${prefix}${section.trimEnd()}`);
    } else {
      updated = `${existing.trimEnd()}\n\n${section}`;
    }
  }

  writeFileAtomic(filePath, updated);
}

function removeNamedSection(filePath, skillName) {
  validateSkillName(skillName);
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  const sectionRe = new RegExp(
    `\\n?## ${escapeRegex(skillName)}[\\s\\S]*?(?=\\n## |$)`,
    'g'
  );
  const updated = content.replace(sectionRe, '').trim();

  if (updated === '') {
    fs.rmSync(filePath, { force: true });
    return;
  }

  writeFileAtomic(filePath, `${updated}\n`);
}

module.exports = {
  buildSkillFilePath,
  writeNamedSkillFile,
  removeNamedSkillFile,
  upsertNamedSection,
  removeNamedSection,
  listSectionNames,
  writeFileAtomic,
};
