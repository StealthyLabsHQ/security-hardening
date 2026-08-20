// Intentionally vulnerable snippets for secure-review smoke tests.
// Do not copy into production.

const { exec } = require("child_process");

function runCommand(userInput) {
  exec("ls " + userInput);
}

function render(name) {
  document.getElementById("out").innerHTML = name;
}

function buildQuery(id) {
  const q = "SELECT * FROM users WHERE id = " + id;
  return db.query(q);
}

function buildTemplateQuery(id) {
  return db.execute(`UPDATE users SET active=1 WHERE id = ${id}`);
}

function runEval(code) {
  return eval(code);
}

module.exports = { runCommand, render, buildQuery, runEval };
