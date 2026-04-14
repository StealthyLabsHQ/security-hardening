'use strict';

const { loadRegistry, listSkills, searchSkills } = require('./registry');
const { install: installSkill } = require('./install');
const { detectAll } = require('./detect');
const adapters = require('./adapters');

const USAGE = `
ai-skills — Universal AI CLI skill installer

Usage:
  ai-skills install <name> [--for <targets>] [--registry <url>]
  ai-skills list [--tag <tag>]
  ai-skills search <query>
  ai-skills targets

Commands:
  install   Install a skill into AI CLI(s)
  list      List all available skills
  search    Search skills by name/description/tag
  targets   Show detected AI CLIs on this machine

Options:
  --for       Comma-separated adapter targets (claude,codex,gemini,cursor,copilot,windsurf)
  --registry  Remote registry URL
  --tag       Filter list by tag
`.trim();

/**
 * Parse a flat argv array into { command, args, flags }.
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
      if (next && !next.startsWith('--')) {
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

/**
 * Print a table with given rows (array of arrays). First element is header row.
 */
function printTable(rows) {
  if (rows.length === 0) return;
  const colWidths = rows[0].map((_, ci) =>
    Math.max(...rows.map((r) => String(r[ci] || '').length))
  );
  const divider = colWidths.map((w) => '-'.repeat(w)).join('-+-');
  rows.forEach((row, ri) => {
    const line = row.map((cell, ci) => String(cell || '').padEnd(colWidths[ci])).join(' | ');
    console.log(line);
    if (ri === 0) console.log(divider);
  });
}

// ── Commands ──────────────────────────────────────────────────────────────────

async function cmdInstall(args, flags) {
  const name = args[0];
  if (!name) {
    console.error('Error: skill name required.\n  Usage: ai-skills install <name>');
    process.exitCode = 1;
    return;
  }

  const targets = flags.for
    ? String(flags.for).split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  let results;
  try {
    results = await installSkill(name, { targets, registry: flags.registry });
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exitCode = 1;
    return;
  }

  if (results.length === 0) {
    console.log('No targets found. Use --for to specify adapters.');
    return;
  }

  for (const r of results) {
    const icon = r.ok ? '\u2713' : '\u2717';
    const msg = r.ok ? `installed to ${r.label}` : `${r.label}: ${r.error}`;
    console.log(`  ${icon} ${msg}`);
  }

  const ok = results.filter((r) => r.ok).length;
  console.log(`\n${ok}/${results.length} adapters installed.`);
}

async function cmdList(args, flags) {
  const registry = await loadRegistry(flags.registry);
  const skills = listSkills(registry, flags.tag);

  if (skills.length === 0) {
    console.log(flags.tag ? `No skills found with tag "${flags.tag}".` : 'No skills found.');
    return;
  }

  const rows = [['Name', 'Tags', 'Description']];
  for (const { name, skill } of skills) {
    rows.push([name, (skill.tags || []).join(', '), skill.description || '']);
  }
  printTable(rows);
}

async function cmdSearch(args, flags) {
  const query = args.join(' ').trim();
  if (!query) {
    console.error('Error: search query required.\n  Usage: ai-skills search <query>');
    process.exitCode = 1;
    return;
  }

  const registry = await loadRegistry(flags.registry);
  const results = searchSkills(registry, query);

  if (results.length === 0) {
    console.log(`No skills matching "${query}". Try \`ai-skills list\` to see all.`);
    return;
  }

  const rows = [['Name', 'Tags', 'Description']];
  for (const { name, skill } of results) {
    rows.push([name, (skill.tags || []).join(', '), skill.description || '']);
  }
  printTable(rows);
}

async function cmdTargets(args, flags) {
  const detected = detectAll();

  const rows = [['Adapter', 'Label', 'Detected', 'Installed skills']];
  for (const [id, adapter] of Object.entries(adapters)) {
    const isDetected = detected[id] ? 'yes' : 'no';
    let count = '—';
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
    case 'install': await cmdInstall(args, flags); break;
    case 'list':    await cmdList(args, flags);    break;
    case 'search':  await cmdSearch(args, flags);  break;
    case 'targets': await cmdTargets(args, flags); break;
    default:
      console.error(`Unknown command "${command}".\n`);
      console.log(USAGE);
      process.exitCode = 1;
  }
}

module.exports = { run };
