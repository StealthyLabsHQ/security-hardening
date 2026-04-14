'use strict';

const { loadRegistry, getSkill, readSkillContent } = require('./registry');
const { detectAll } = require('./detect');
const adapters = require('./adapters');

/**
 * Install a skill into one or more AI CLIs.
 *
 * @param {string} name        — skill name
 * @param {object} opts
 * @param {string[]} [opts.targets]   — adapter ids to install to (default: auto-detect)
 * @param {string}   [opts.registry]  — remote registry URL
 * @returns {Promise<Array<{adapter: string, label: string, ok: boolean, error?: string}>>}
 */
async function install(name, opts = {}) {
  const registry = await loadRegistry(opts.registry);
  const skill = getSkill(name, registry);

  if (!skill) {
    const available = Object.keys(registry.skills).join(', ');
    throw new Error(`Skill "${name}" not found. Available: ${available}\nRun \`ai-skills list\` for details.`);
  }

  const content = await readSkillContent(skill);

  // Determine which adapters to use
  let targetIds;
  if (opts.targets && opts.targets.length > 0) {
    targetIds = opts.targets;
  } else {
    // Auto-detect installed CLIs, intersected with adapters that support this skill
    const detected = detectAll();
    const supported = new Set(skill.adapters || Object.keys(adapters));
    targetIds = Object.entries(detected)
      .filter(([id, present]) => present && supported.has(id))
      .map(([id]) => id);

    if (targetIds.length === 0) {
      // Fallback: install for all supported adapters
      targetIds = [...supported];
    }
  }

  const results = [];
  for (const id of targetIds) {
    const adapter = adapters[id];
    if (!adapter) {
      results.push({ adapter: id, label: id, ok: false, error: `Unknown adapter "${id}"` });
      continue;
    }
    try {
      adapter.install(name, content);
      results.push({ adapter: id, label: adapter.label, ok: true });
    } catch (err) {
      results.push({ adapter: id, label: adapter.label, ok: false, error: err.message });
    }
  }

  return results;
}

module.exports = { install };
