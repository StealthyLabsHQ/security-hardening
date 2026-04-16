'use strict';

const path = require('path');

const SKILL_NAME_RE = /^[a-z0-9](?:[a-z0-9-]{0,63})$/;
const IMMUTABLE_REF_RE = /^[0-9a-f]{40}$/i;

function validateSkillName(skillName) {
  if (typeof skillName !== 'string' || !SKILL_NAME_RE.test(skillName)) {
    throw new Error(
      `Invalid skill name "${skillName}". Use lowercase letters, numbers, and hyphens only.`
    );
  }
  return skillName;
}

function validateRelativeRepoPath(filePath) {
  if (typeof filePath !== 'string' || filePath.trim() === '') {
    throw new Error('Invalid skill file path: expected a non-empty relative path.');
  }

  if (filePath.includes('\0') || filePath.includes('\\') || /^[a-z]:/i.test(filePath)) {
    throw new Error(`Invalid skill file path "${filePath}".`);
  }

  const normalized = path.posix.normalize(filePath);
  if (
    normalized === '.' ||
    normalized === '..' ||
    normalized.startsWith('../') ||
    normalized.startsWith('/') ||
    path.posix.isAbsolute(normalized)
  ) {
    throw new Error(`Invalid skill file path "${filePath}".`);
  }

  return normalized;
}

function validateStringArray(value, fieldName) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string' || entry.trim() === '')) {
    throw new Error(`Invalid "${fieldName}" field in registry.`);
  }
  return [...value];
}

function validateRegistry(registry) {
  if (!registry || typeof registry !== 'object' || Array.isArray(registry)) {
    throw new Error('Invalid registry payload.');
  }

  if (!registry.skills || typeof registry.skills !== 'object' || Array.isArray(registry.skills)) {
    throw new Error('Invalid registry payload: missing "skills" object.');
  }

  const skills = {};
  for (const [skillName, skill] of Object.entries(registry.skills)) {
    validateSkillName(skillName);

    if (!skill || typeof skill !== 'object' || Array.isArray(skill)) {
      throw new Error(`Invalid registry payload for skill "${skillName}".`);
    }

    skills[skillName] = {
      ...skill,
      file: validateRelativeRepoPath(skill.file),
    };

    if (skill.description !== undefined && typeof skill.description !== 'string') {
      throw new Error(`Invalid description for skill "${skillName}".`);
    }

    const tags = validateStringArray(skill.tags, 'tags');
    if (tags) skills[skillName].tags = tags;

    const adapters = validateStringArray(skill.adapters, 'adapters');
    if (adapters) skills[skillName].adapters = adapters;
  }

  return { ...registry, skills };
}

function isImmutableRef(ref) {
  return typeof ref === 'string' && IMMUTABLE_REF_RE.test(ref);
}

module.exports = {
  validateSkillName,
  validateRelativeRepoPath,
  validateRegistry,
  isImmutableRef,
};
