'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const childProcess = require('child_process');

function withPatched(object, key, value, fn) {
  const original = object[key];
  object[key] = value;
  const finalize = () => {
    object[key] = original;
  };

  try {
    const result = fn();
    if (result && typeof result.then === 'function') {
      return result.finally(finalize);
    }
    finalize();
    return result;
  } catch (error) {
    finalize();
    throw error;
  }
}

function freshRequire(modulePath) {
  const resolved = require.resolve(modulePath);
  delete require.cache[resolved];
  return require(resolved);
}

function stubModule(modulePath, exportsValue) {
  const resolved = require.resolve(modulePath);
  const previous = require.cache[resolved];
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports: exportsValue,
  };

  return () => {
    if (previous) {
      require.cache[resolved] = previous;
      return;
    }
    delete require.cache[resolved];
  };
}

test('installFromRef rejects skill names that can escape adapter paths', async () => {
  const restoreRegistry = stubModule('../lib/registry.js', {
    resolveRef: () => ({ owner: 'owner', repo: 'repo', branch: 'main' }),
    fetchRegistry: async () => ({
      skills: {
        '../escape': {
          file: 'skills/security-review.md',
        },
      },
    }),
    fetchSkillContent: async () => '# malicious skill',
    loadRegistry: async () => ({ skills: {} }),
    getSkill: () => null,
  });
  const restoreStore = stubModule('../lib/store.js', {
    record: () => {},
  });
  const restoreDetect = stubModule('../lib/detect.js', {
    detectAll: () => ({ claude: true }),
  });

  const installed = [];
  const restoreAdapters = stubModule('../lib/adapters/index.js', {
    claude: {
      label: 'Claude Code',
      install: (skillName) => installed.push(skillName),
    },
  });

  try {
    const { installFromRef } = freshRequire('../lib/install.js');
    await withPatched(console, 'warn', () => {}, async () => {
      await assert.rejects(
        installFromRef('owner/repo'),
        /invalid skill name/i
      );
    });
    assert.deepEqual(installed, []);
  } finally {
    restoreAdapters();
    restoreDetect();
    restoreStore();
    restoreRegistry();
    delete require.cache[require.resolve('../lib/install.js')];
  }
});

test('installFromRef rejects registry entries with unsafe file paths', async () => {
  const restoreRegistry = stubModule('../lib/registry.js', {
    resolveRef: () => ({ owner: 'owner', repo: 'repo', branch: 'main' }),
    fetchRegistry: async () => ({
      skills: {
        'security-review': {
          file: '../outside.md',
        },
      },
    }),
    fetchSkillContent: async () => '# malicious skill',
    loadRegistry: async () => ({ skills: {} }),
    getSkill: () => null,
  });
  const restoreStore = stubModule('../lib/store.js', {
    record: () => {},
  });
  const restoreDetect = stubModule('../lib/detect.js', {
    detectAll: () => ({ claude: true }),
  });
  const restoreAdapters = stubModule('../lib/adapters/index.js', {
    claude: {
      label: 'Claude Code',
      install: () => {
        throw new Error('should not install');
      },
    },
  });

  try {
    const { installFromRef } = freshRequire('../lib/install.js');
    await withPatched(console, 'warn', () => {}, async () => {
      await assert.rejects(
        installFromRef('owner/repo'),
        /invalid skill file path/i
      );
    });
  } finally {
    restoreAdapters();
    restoreDetect();
    restoreStore();
    restoreRegistry();
    delete require.cache[require.resolve('../lib/install.js')];
  }
});

test('installFromRef warns when using a mutable branch reference', async () => {
  const warnings = [];
  const restoreRegistry = stubModule('../lib/registry.js', {
    resolveRef: () => ({ owner: 'owner', repo: 'repo', branch: 'main' }),
    fetchRegistry: async () => ({
      skills: {
        'security-review': {
          file: 'skills/security-review.md',
        },
      },
    }),
    fetchSkillContent: async () => '# content',
    loadRegistry: async () => ({ skills: {} }),
    getSkill: () => null,
  });
  const restoreStore = stubModule('../lib/store.js', {
    record: () => {},
  });
  const restoreDetect = stubModule('../lib/detect.js', {
    detectAll: () => ({ claude: true }),
  });
  const restoreAdapters = stubModule('../lib/adapters/index.js', {
    claude: {
      label: 'Claude Code',
      install: () => {},
    },
  });

  try {
    const { installFromRef } = freshRequire('../lib/install.js');
    await withPatched(console, 'warn', (message) => warnings.push(message), async () => {
      await installFromRef('owner/repo@main');
    });
    assert.equal(warnings.length, 1);
    assert.match(String(warnings[0]), /immutable/i);
  } finally {
    restoreAdapters();
    restoreDetect();
    restoreStore();
    restoreRegistry();
    delete require.cache[require.resolve('../lib/install.js')];
  }
});

test('detectAll does not auto-detect Copilot from gh config alone', async () => {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-skills-home-'));
  fs.mkdirSync(path.join(tempHome, '.config', 'gh'), { recursive: true });

  try {
    await withPatched(os, 'homedir', () => tempHome, async () => {
      await withPatched(childProcess, 'execSync', (command) => {
        if (String(command).includes('gh')) {
          throw new Error('gh not available');
        }
        throw new Error('binary not available');
      }, async () => {
        const detect = freshRequire('../lib/detect.js');
        const detected = detect.detectAll();
        assert.equal(detected.copilot, false);
      });
    });
  } finally {
    delete require.cache[require.resolve('../lib/detect.js')];
    fs.rmSync(tempHome, { recursive: true, force: true });
  }
});

test('detectAll finds Copilot only when repository instructions already exist', async () => {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-skills-home-'));
  const tempRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-skills-repo-'));
  fs.mkdirSync(path.join(tempRepo, '.github'), { recursive: true });
  fs.writeFileSync(
    path.join(tempRepo, '.github', 'copilot-instructions.md'),
    '# existing instructions\n',
    'utf8'
  );

  const originalCwd = process.cwd();

  try {
    process.chdir(tempRepo);
    await withPatched(os, 'homedir', () => tempHome, async () => {
      await withPatched(childProcess, 'execSync', () => {
        throw new Error('binary not available');
      }, async () => {
        const detect = freshRequire('../lib/detect.js');
        const detected = detect.detectAll();
        assert.equal(detected.copilot, true);
      });
    });
  } finally {
    process.chdir(originalCwd);
    delete require.cache[require.resolve('../lib/detect.js')];
    fs.rmSync(tempHome, { recursive: true, force: true });
    fs.rmSync(tempRepo, { recursive: true, force: true });
  }
});

test('codex adapter writes to AGENTS.md and updates existing sections in place', async () => {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-skills-home-'));

  try {
    await withPatched(os, 'homedir', () => tempHome, async () => {
      const codex = freshRequire('../lib/adapters/codex.js');
      codex.install('security-review', '# first version');
      codex.install('security-review', '# updated version');

      const codexDir = path.join(tempHome, '.codex');
      const agentsFile = path.join(codexDir, 'AGENTS.md');
      const legacyFile = path.join(codexDir, 'instructions.md');

      assert.equal(fs.existsSync(agentsFile), true);
      assert.equal(fs.existsSync(legacyFile), false);

      const content = fs.readFileSync(agentsFile, 'utf8');
      assert.match(content, /## security-review/);
      assert.match(content, /updated version/);
      assert.equal((content.match(/## security-review/g) || []).length, 1);
    });
  } finally {
    delete require.cache[require.resolve('../lib/adapters/codex.js')];
    fs.rmSync(tempHome, { recursive: true, force: true });
  }
});

test('install rejects local registry entries with Windows absolute skill paths', async () => {
  const restoreRegistry = stubModule('../lib/registry.js', {
    resolveRef: () => ({ owner: 'owner', repo: 'repo', branch: 'main' }),
    fetchRegistry: async () => ({ skills: {} }),
    fetchSkillContent: async () => '# content',
    loadRegistry: async () => ({
      skills: {
        'security-review': {
          file: 'C:/Windows/System32/drivers/etc/hosts',
        },
      },
    }),
    getSkill: (name, registry) => registry.skills[name] || null,
  });
  const restoreDetect = stubModule('../lib/detect.js', {
    detectAll: () => ({ claude: true }),
  });
  const restoreAdapters = stubModule('../lib/adapters/index.js', {
    claude: {
      label: 'Claude Code',
      install: () => {
        throw new Error('should not install');
      },
    },
  });

  try {
    const { install } = freshRequire('../lib/install.js');
    await assert.rejects(
      install('security-review'),
      /invalid skill file path/i
    );
  } finally {
    restoreAdapters();
    restoreDetect();
    restoreRegistry();
    delete require.cache[require.resolve('../lib/install.js')];
  }
});

test('binaryExists uses execFileSync arguments instead of shell interpolation', async () => {
  const originalExecFileSync = childProcess.execFileSync;
  const originalExecSync = childProcess.execSync;

  const calls = [];
  childProcess.execFileSync = (command, args) => {
    calls.push({ command, args });
    return Buffer.from('');
  };
  childProcess.execSync = () => {
    throw new Error('execSync should not be used');
  };

  try {
    const detect = freshRequire('../lib/detect.js');
    assert.equal(detect.binaryExists('codex'), true);
    assert.equal(calls.length, 1);
    assert.ok(Array.isArray(calls[0].args));
    assert.equal(calls[0].args.includes('codex'), true);
  } finally {
    childProcess.execFileSync = originalExecFileSync;
    childProcess.execSync = originalExecSync;
    delete require.cache[require.resolve('../lib/detect.js')];
  }
});
