#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Find all .ts files in src/
function findTsFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findTsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

// Add .js extension to relative imports
function fixImports(content) {
  // Replace relative imports that don't already have .js
  // Matches: from './path' or from "../path"
  return content.replace(
    /from\s+['"](\..+?)['"](?!\.js)/g,
    (match, importPath) => {
      // Don't add .js if it's already there
      if (importPath.endsWith('.js')) {
        return match;
      }
      return `from '${importPath}.js'`;
    }
  );
}

const srcDir = path.join(__dirname, 'src');
const files = findTsFiles(srcDir);

console.log(`Found ${files.length} .ts files\n`);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  content = fixImports(content);
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✓ ${path.relative(srcDir, file)}`);
  }
}

console.log('\n✓ All imports fixed!');
