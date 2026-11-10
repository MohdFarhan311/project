const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const ignoredDirectories = new Set(['node_modules', 'coverage', 'dist', 'build']);
const javascriptFiles = [];

function collectJavaScript(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) collectJavaScript(fullPath);
    else if (entry.isFile() && entry.name.endsWith('.js')) javascriptFiles.push(fullPath);
  }
}

collectJavaScript(root);
for (const file of javascriptFiles) {
  execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
}

// Loading the Express app checks that application modules initialize without
// opening a database connection or binding a network port.
require(path.join(root, 'server.js'));
console.log(`Validated syntax for ${javascriptFiles.length} JavaScript files and loaded the Express app.`);
