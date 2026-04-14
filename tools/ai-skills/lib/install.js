'use strict';

const fs = require('fs');
const path = require('path');
const { resolveRef, fetchRegistry, fetchSkillContent, loadRegistry, getSkill } = require('./registry');
const { record } = require('./store');
const { detectAll } = require('./detect');
const adapters = require('./adapters');

const LOCAL_REGISTRY = path.join(__dirname, '..', 'registry.json');

/**
 * Read bundled skill content from local file or url field.
 * @param {object} skill
 * @returns {Promise<string>}
 */
async function readLocalSkillContent(skill) {
  if (skill.file) {
    const filePath = path.isAbsolute(skill.file)
      ? skill.file
      : path.join(path.dirname(LOCAL_REGISTRY), skill.file);
    return fs.readFileSync(filePath, 'utf8');
  }
  throw new Error('Skill has no file path.');
}

/**
 * Install a single skill (by name + content) into the requested adapters.
 * @param {string}   skillName
 * @param {string}   content
 * @param {string[]} targetIds
 * @returns {Array<{adapter: string, label: string, ok: boolean, error?: string}>}
 */
function applyToAdapters(skillName, content, targetIds) {
  const results = [];
  for (const id of targetIds) {
    const adapter = adapters[id];
    if (!adapter) {
      results.push({ adapter: id, label: id, ok: false, error: `Unknown adapter "${id}"` });
      continue;
    }
    try {
      adapter.install(skillName, content);
      results.push({ adapter: id, label: adapter.label, ok: true });
    } catch (err) {
      results.push({ adapter: id, label: adapter.label, ok: false, error: err.message });
    }
  }
  return results;
}

/**
 * Resolve which adapter IDs to use given an optional --for flag value.
 * @param {string[]} [forTargets]
 * @returns {string[]}
 */
function resolveTargets(forTargets) {
  if (forTargets && forTargets.length > 0) return forTargets;
  const detected = detectAll();
  const active = Object.entries(detected)
    .filter(([, present]) => present)
    .map(([id]) => id);
  return active.length > 0 ? active : Object.keys(adapters);
}

/**
 * Install skills from a GitHub-hosted registry (new primary flow).
 *
 * @param {string}  ref        "owner/repo" or "owner/repo@branch"
 * @param {string}  [skillName] install only this skill from the registry
 * @param {object}  opts
 * @param {string[]} [opts.targets]  adapter ids (--for)
 * @returns {Promise<Array<{skill: string, results: Array}>>}
 */
async function installFromRef(ref, skillName, opts = {}) {
  const { owner, repo, branch } = resolveRef(ref);
  const ownerRepo = `${owner}/${repo}`;

  let registry;
  try {
    registry = await fetchRegistry(ownerRepo, branch);
  } catch (err) {
    throw new Error(`Could not fetch registry from ${ownerRepo}@${branch}: ${err.message}`);
  }

  const targetIds = resolveTargets(opts.targets);

  // Determine which skills to install
  let skillEntries;
  if (skillName) {
    const skill = (registry.skills || {})[skillName];
    if (!skill) {
      const available = Object.keys(registry.skills || {}).join(', ') || '(none)';
      throw new Error(`Skill "${skillName}" not found in ${ownerRepo}. Available: ${available}`);
    }
    skillEntries = [[skillName, skill]];
  } else {
    skillEntries = Object.entries(registry.skills || {});
    if (skillEntries.length === 0) {
      throw new Error(`Registry at ${ownerRepo}@${branch} has no skills.`);
    }
  }

  const output = [];
  for (const [name, skill] of skillEntries) {
    let content;
    try {
      content = await fetchSkillContent(ownerRepo, branch, skill.file);
    } catch (err) {
      output.push({
        skill: name,
        results: [{ adapter: 'fetch', label: 'fetch', ok: false, error: err.message }],
      });
      continue;
    }

    const results = applyToAdapters(name, content, targetIds);
    const successAdapters = results.filter((r) => r.ok).map((r) => r.adapter);
    if (successAdapters.length > 0) {
      record(name, ownerRepo, branch, successAdapters);
    }
    output.push({ skill: name, results });
  }

  return output;
}

/**
 * Install a skill from the local bundled registry (backward compat).
 *
 * @param {string} name
 * @param {object} opts
 * @param {string[]} [opts.targets]
 * @param {string}   [opts.registry]
 * @returns {Promise<Array<{adapter: string, label: string, ok: boolean, error?: string}>>}
 */
async function install(name, opts = {}) {
  const registry = await loadRegistry(opts.registry);
  const skill = getSkill(name, registry);

  if (!skill) {
    const available = Object.keys(registry.skills).join(', ');
    throw new Error(`Skill "${name}" not found. Available: ${available}`);
  }

  const content = await readLocalSkillContent(skill);
  const targetIds = resolveTargets(opts.targets);
  return applyToAdapters(name, content, targetIds);
}

module.exports = { installFromRef, install };
