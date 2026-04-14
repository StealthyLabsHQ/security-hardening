'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

const LOCAL_REGISTRY = path.join(__dirname, '..', 'registry.json');

/**
 * Fetch a URL and return the body as a string (follows one redirect).
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
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} fetching ${url}`));
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      res.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Parse "owner/repo@branch" or "owner/repo" into { owner, repo, branch }.
 * branch defaults to "main".
 * @param {string} ref
 * @returns {{ owner: string, repo: string, branch: string }}
 */
function resolveRef(ref) {
  const [ownerRepo, branch = 'main'] = ref.split('@');
  const [owner, repo] = ownerRepo.split('/');
  if (!owner || !repo) {
    throw new Error(`Invalid ref "${ref}". Expected "owner/repo" or "owner/repo@branch".`);
  }
  return { owner, repo, branch };
}

/**
 * Fetch registry.json from GitHub raw URL.
 * @param {string} ownerRepo  e.g. "StealthyLabsHQ/security-hardening"
 * @param {string} [branch]   defaults to "main"
 * @returns {Promise<object>}
 */
async function fetchRegistry(ownerRepo, branch = 'main') {
  const url = `https://raw.githubusercontent.com/${ownerRepo}/${branch}/registry.json`;
  const raw = await fetchUrl(url);
  return JSON.parse(raw);
}

/**
 * Fetch a single skill .md file from GitHub raw URL.
 * @param {string} ownerRepo  e.g. "StealthyLabsHQ/security-hardening"
 * @param {string} branch
 * @param {string} filePath   relative path from registry's "file" field
 * @returns {Promise<string>}
 */
async function fetchSkillContent(ownerRepo, branch, filePath) {
  const url = `https://raw.githubusercontent.com/${ownerRepo}/${branch}/${filePath}`;
  return fetchUrl(url);
}

/**
 * Load the local bundled registry (fallback / offline use).
 * @param {string} [registryUrl]  optional remote URL
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

module.exports = {
  resolveRef,
  fetchRegistry,
  fetchSkillContent,
  loadRegistry,
  getSkill,
  listSkills,
  searchSkills,
};
