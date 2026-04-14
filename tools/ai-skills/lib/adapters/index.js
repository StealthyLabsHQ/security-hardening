'use strict';

const claude   = require('./claude');
const codex    = require('./codex');
const gemini   = require('./gemini');
const cursor   = require('./cursor');
const copilot  = require('./copilot');
const windsurf = require('./windsurf');

const ALL = { claude, codex, gemini, cursor, copilot, windsurf };

module.exports = ALL;
