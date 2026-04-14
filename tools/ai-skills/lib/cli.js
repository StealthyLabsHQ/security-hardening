'use strict';

const { installFromRef } = require('./install');
const { getAll } = require('./store');
const { detectAll } = require('./detect');
const adapters = require('./adapters');

const USAGE = `
ai-skill — Universal AI CLI skill installer

Usage:
  ai-skill add <owner/repo> [skill] [--for <targets>] [--branch <branch>]
  ai-skill list
  ai-skill remove <skill>
  ai-skill targets

Examples:
  ai-skill add StealthyLabsHQ/security-hardening
  ai-skill add StealthyLabsHQ/security-hardening security-review
  ai-skill add StealthyLabsHQ/security-hardening --for claude,codex
  ai-skill add StealthyLabsHQ/security-hardening@dev
`.trim();

// ── Arg parser ────────────────────────────────────────────────────────────────

/**
 * Parse argv into { command, args, flags }.
 * Handles --flag value and --flag (boolean) forms.
 */
function parseArgs(argv) {
  const flags = {};
  const positional = [];
  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        flags[key] = next;
        i += 2;
      } else {
        flags[key] = true;
        i += 1;
      }
    } else {
      positional.push(arg);
      i += 1;
    }
  }
  return { command: positional[0], args: positional.slice(1), flags };
}

// ── Table printer ─────────────────────────────────────────────────────────────

function printTable(rows) {
  if (rows.length === 0) return;
  const colWidths = rows[0].map((_, ci) =>
    Math.max(...rows.map((r) => String(r[ci] || '').length))
  );
  const divider = colWidths.map((w) => '-'.repeat(w)).join('-+-');
  rows.forEach((row, ri) => {
    const line = row
      .map((cell, ci) => String(cell || '').padEnd(colWidths[ci]))
      .join(' | ');
    console.log(line);
    if (ri === 0) console.log(divider);
  });
}

// ── Commands ──────────────────────────────────────────────────────────────────

/**
 * ai-skill add <owner/repo[@branch]> [skillName] [--for claude,codex] [--branch branch]
 *
 * If --branch is given it overrides the @branch syntax.
 */
async function cmdAdd(args, flags) {
  let ref = args[0];
  if (!ref) {
    console.error('Error: ref required.\n  Usage: ai-skill add <owner/repo> [skill] [--for targets]');
    process.exitCode = 1;
    return;
  }

  // Support --branch flag as override (append to ref)
  if (flags.branch && !ref.includes('@')) {
    ref = `${ref}@${flags.branch}`;
  }

  // Second positional may be a skill name — but only if it doesn't look like a flag
  // (args[1] is undefined when only --for is passed)
  const skillName = args[1] || null;

  const targets = flags.for
    ? String(flags.for).split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  let output;
  try {
    output = await installFromRef(ref, skillName, { targets });
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exitCode = 1;
    return;
  }

  let totalOk = 0;
  let totalFail = 0;

  for (const { skill, results } of output) {
    console.log(`\nSkill: ${skill}`);
    for (const r of results) {
      const icon = r.ok ? '\u2713' : '\u2717';
      const detail = r.ok ? r.label : `${r.label}: ${r.error}`;
      console.log(`  ${icon} ${detail}`);
      if (r.ok) totalOk++; else totalFail++;
    }
  }

  console.log(`\n${totalOk} installed, ${totalFail} failed.`);
}

/**
 * ai-skill list
 * Shows installed skills from store + adapter discovery.
 */
async function cmdList(args, flags) {
  const stored = getAll();

  // Merge adapter-discovered skills (in case store is out of sync)
  const allNames = new Set(Object.keys(stored));
  for (const [id, adapter] of Object.entries(adapters)) {
    try {
      for (const name of adapter.installedSkills()) {
        allNames.add(name);
      }
    } catch {}
  }

  if (allNames.size === 0) {
    console.log('No skills installed. Use `ai-skill add <owner/repo>` to install.');
    return;
  }

  const rows = [['Name', 'Source', 'Branch', 'Adapters', 'Installed']];
  for (const name of [...allNames].sort()) {
    const entry = stored[name];
    rows.push([
      name,
      entry ? entry.source : '(unknown)',
      entry ? entry.branch : '—',
      entry ? (entry.adapters || []).join(', ') : '—',
      entry ? entry.installedAt.slice(0, 10) : '—',
    ]);
  }
  printTable(rows);
}

/**
 * ai-skill remove <skillName>
 */
async function cmdRemove(args, flags) {
  const skillName = args[0];
  if (!skillName) {
    console.error('Error: skill name required.\n  Usage: ai-skill remove <skill>');
    process.exitCode = 1;
    return;
  }

  let removed = 0;
  let failed = 0;

  for (const [id, adapter] of Object.entries(adapters)) {
    // Only try adapters that report this skill as installed, OR all adapters if
    // we can't tell (remove is idempotent in each adapter).
    let isInstalled = false;
    try {
      isInstalled = adapter.installedSkills().includes(skillName);
    } catch {}

    if (!isInstalled) continue;

    try {
      adapter.remove(skillName);
      console.log(`  \u2713 removed from ${adapter.label}`);
      removed++;
    } catch (err) {
      console.error(`  \u2717 ${adapter.label}: ${err.message}`);
      failed++;
    }
  }

  // Remove from store regardless
  try {
    const { unrecord } = require('./store');
    unrecord(skillName);
  } catch {}

  if (removed === 0 && failed === 0) {
    console.log(`Skill "${skillName}" was not found in any installed adapter.`);
  } else {
    console.log(`\n${removed} removed, ${failed} failed.`);
  }
}

/**
 * ai-skill targets
 * Shows detected AI CLIs.
 */
async function cmdTargets(args, flags) {
  const detected = detectAll();

  const rows = [['Adapter', 'Label', 'Detected', 'Installed skills']];
  for (const [id, adapter] of Object.entries(adapters)) {
    const isDetected = detected[id] ? 'yes' : 'no';
    let count = '\u2014';
    try {
      const skills = adapter.installedSkills();
      count = String(skills.length);
    } catch {}
    rows.push([id, adapter.label, isDetected, count]);
  }
  printTable(rows);
}

// ── Entry point ───────────────────────────────────────────────────────────────

async function run(argv) {
  const { command, args, flags } = parseArgs(argv);

  if (!command || flags.help || flags.h) {
    console.log(USAGE);
    return;
  }

  switch (command) {
    case 'add':     await cmdAdd(args, flags);     break;
    case 'list':    await cmdList(args, flags);    break;
    case 'remove':  await cmdRemove(args, flags);  break;
    case 'targets': await cmdTargets(args, flags); break;
    default:
      console.error(`Unknown command "${command}".\n`);
      console.log(USAGE);
      process.exitCode = 1;
  }
}

module.exports = { run };
