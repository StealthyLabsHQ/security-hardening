'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

const LOCAL_REGISTRY = path.join(__dirname, '..', 'registry.json');
const SKILLS_DIR = path.join(__dirname, '..', 'skills');

/**
 * Fetch a URL and return the body as a string.
 * @param {string} url
 * @returns {Promise<string>}
 */
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} fetching ${url}`));
        res.resume();
        return;
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      res.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Load the skill registry. Fetches remote if registryUrl provided, else reads local.
 * @param {string} [registryUrl]
 * @returns {Promise<object>}
 */
async function loadRegistry(registryUrl) {
  if (registryUrl) {
    try {
      const raw = await fetchUrl(registryUrl);
      return JSON.parse(raw);
    } catch (err) {
      console.warn(`Warning: could not fetch remote registry (${err.message}), falling back to local.`);
    }
  }
  const raw = fs.readFileSync(LOCAL_REGISTRY, 'utf8');
  return JSON.parse(raw);
}

/**
 * Get skill metadata by name.
 * @param {string} name
 * @param {object} registry
 * @returns {object|null}
 */
function getSkill(name, registry) {
  return registry.skills[name] || null;
}

/**
 * Read the content of a skill — from bundled file or remote URL.
 * @param {object} skill  — skill metadata object from registry
 * @returns {Promise<string>}
 */
async function readSkillContent(skill) {
  if (skill.url) {
    try {
      return await fetchUrl(skill.url);
    } catch (err) {
      console.warn(`Warning: could not fetch skill content from ${skill.url}: ${err.message}`);
    }
  }
  if (skill.file) {
    const filePath = path.isAbsolute(skill.file)
      ? skill.file
      : path.join(path.dirname(LOCAL_REGISTRY), skill.file);
    return fs.readFileSync(filePath, 'utf8');
  }
  throw new Error('Skill has neither file nor url.');
}

/**
 * List skills, optionally filtered by tag.
 * @param {object} registry
 * @param {string} [tag]
 * @returns {Array<{name: string, skill: object}>}
 */
function listSkills(registry, tag) {
  return Object.entries(registry.skills)
    .filter(([, skill]) => !tag || (skill.tags && skill.tags.includes(tag)))
    .map(([name, skill]) => ({ name, skill }));
}

/**
 * Search skills by query (fuzzy match on name, description, tags).
 * @param {object} registry
 * @param {string} query
 * @returns {Array<{name: string, skill: object, score: number}>}
 */
function searchSkills(registry, query) {
  const q = query.toLowerCase();
  const results = [];
  for (const [name, skill] of Object.entries(registry.skills)) {
    let score = 0;
    if (name.toLowerCase().includes(q)) score += 3;
    if (skill.description && skill.description.toLowerCase().includes(q)) score += 2;
    if (skill.tags && skill.tags.some((t) => t.toLowerCase().includes(q))) score += 1;
    if (score > 0) results.push({ name, skill, score });
  }
  return results.sort((a, b) => b.score - a.score);
}

module.exports = { loadRegistry, getSkill, readSkillContent, listSkills, searchSkills };
