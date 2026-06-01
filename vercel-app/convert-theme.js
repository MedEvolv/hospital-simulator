const fs = require('fs');
const path = require('path');

const dirPath = 'C:\\ArchLife-Systems\\hospital-simulator\\vercel-app';
const dirsToProcess = ['app', 'components'];

const replacements = [
  { from: /text-slate-50\b/g, to: 'text-slate-900' },
  { from: /text-slate-100\b/g, to: 'text-slate-900' },
  { from: /text-slate-200\b/g, to: 'text-slate-800' },
  { from: /text-slate-300\b/g, to: 'text-slate-700' },
  { from: /text-slate-400\b/g, to: 'text-slate-600' },
  { from: /bg-slate-900\b/g, to: 'bg-white' },
  { from: /bg-slate-950\b/g, to: 'bg-slate-50' },
  { from: /border-slate-800\b/g, to: 'border-slate-200' },
  { from: /border-slate-700\b/g, to: 'border-slate-300' },
  { from: /bg-slate-800\b/g, to: 'bg-slate-100' },
  { from: /text-sky-300\b/g, to: 'text-sky-700' },
  { from: /text-sky-400\b/g, to: 'text-sky-600' },
  { from: /bg-sky-950\b/g, to: 'bg-sky-50' },
  { from: /border-sky-800\b/g, to: 'border-sky-200' },
  { from: /border-amber-900\b/g, to: 'border-amber-200' },
  { from: /bg-amber-950\b/g, to: 'bg-amber-50' },
  { from: /border-blue-900\b/g, to: 'border-blue-200' },
  { from: /bg-blue-950\b/g, to: 'bg-blue-50' },
  { from: /text-blue-400\b/g, to: 'text-blue-600' },
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const rule of replacements) {
        if (rule.from.test(content)) {
          content = content.replace(rule.from, rule.to);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

dirsToProcess.forEach(dir => {
  processDirectory(path.join(dirPath, dir));
});
console.log('Done mapping dark mode to light mode for sandbox-v2.');
