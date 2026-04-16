'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const { validateRegistry, validateRelativeRepoPath } = require('./validation');

const LOCAL_REGISTRY = path.join(__dirname, '..', 'registry.json');
const RAW_GITHUB_HOST = 'raw.githubusercontent.com';
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_REDIRECTS = 2;
const DEFAULT_REGISTRY_BYTES = 256 * 1024;
const DEFAULT_SKILL_BYTES = 512 * 1024;

function normalizeUrl(url, allowedHosts) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid URL "${url}".`);
  }

  if (parsed.protocol !== 'https:') {
    throw new Error(`Only https:// URLs are allowed: ${url}`);
  }

  if (allowedHosts && !allowedHosts.includes(parsed.hostname)) {
    throw new Error(`Host "${parsed.hostname}" is not in the allowlist.`);
  }

  return parsed;
}

/**
 * Fetch a URL and return the body as a string (follows one redirect).
 * @param {string} url
 * @returns {Promise<string>}
 */
function fetchUrl(url, options = {}) {
  const allowedHosts = options.allowedHosts || [RAW_GITHUB_HOST];
  const maxBytes = options.maxBytes || DEFAULT_REGISTRY_BYTES;
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const parsedUrl = normalizeUrl(url, allowedHosts);

  return new Promise((resolve, reject) => {
    let settled = false;
    const fail = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    const succeed = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const req = https.get(parsedUrl, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        if (maxRedirects <= 0) {
          fail(new Error(`Too many redirects fetching ${parsedUrl}`));
          return;
        }

        let redirectUrl;
        try {
          redirectUrl = new URL(res.headers.location, parsedUrl).toString();
        } catch {
          fail(new Error(`Invalid redirect while fetching ${parsedUrl}`));
          return;
        }

        fetchUrl(redirectUrl, {
          allowedHosts,
          maxBytes,
          timeoutMs,
          maxRedirects: maxRedirects - 1,
        }).then(succeed, fail);
        return;
      }

      if (res.statusCode !== 200) {
        res.resume();
        fail(new Error(`HTTP ${res.statusCode} fetching ${parsedUrl}`));
        return;
      }

      const chunks = [];
      let totalBytes = 0;
      res.on('data', (chunk) => {
        totalBytes += chunk.length;
        if (totalBytes > maxBytes) {
          res.destroy();
          fail(new Error(`Response exceeded ${maxBytes} bytes fetching ${parsedUrl}`));
          return;
        }
        chunks.push(chunk);
      });
      res.on('end', () => succeed(Buffer.concat(chunks).toString('utf8')));
      res.on('error', fail);
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Timed out after ${timeoutMs}ms fetching ${parsedUrl}`));
    });
    req.on('error', fail);
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
  const raw = await fetchUrl(url, {
    allowedHosts: [RAW_GITHUB_HOST],
    maxBytes: DEFAULT_REGISTRY_BYTES,
  });
  return validateRegistry(JSON.parse(raw));
}

/**
 * Fetch a single skill .md file from GitHub raw URL.
 * @param {string} ownerRepo  e.g. "StealthyLabsHQ/security-hardening"
 * @param {string} branch
 * @param {string} filePath   relative path from registry's "file" field
 * @returns {Promise<string>}
 */
async function fetchSkillContent(ownerRepo, branch, filePath) {
  const safePath = validateRelativeRepoPath(filePath);
  const url = `https://raw.githubusercontent.com/${ownerRepo}/${branch}/${safePath}`;
  return fetchUrl(url, {
    allowedHosts: [RAW_GITHUB_HOST],
    maxBytes: DEFAULT_SKILL_BYTES,
  });
}

/**
 * Load the local bundled registry (fallback / offline use).
 * @param {string} [registryUrl]  optional remote URL
 * @returns {Promise<object>}
 */
async function loadRegistry(registryUrl) {
  if (registryUrl) {
    try {
      const raw = await fetchUrl(registryUrl, {
        allowedHosts: [RAW_GITHUB_HOST],
        maxBytes: DEFAULT_REGISTRY_BYTES,
      });
      return validateRegistry(JSON.parse(raw));
    } catch (err) {
      console.warn(`Warning: could not fetch remote registry (${err.message}), falling back to local.`);
    }
  }
  const raw = fs.readFileSync(LOCAL_REGISTRY, 'utf8');
  return validateRegistry(JSON.parse(raw));
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
