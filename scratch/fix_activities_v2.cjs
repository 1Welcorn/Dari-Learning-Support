const fs = require('fs');
const path = 'src/components/features/Activities.tsx';
const lines = fs.readFileSync(path, 'utf8').split('\n');

// Lines are 1-indexed in view_file. 
// Line 605 is index 604.
// Line 625 is index 624.
const newLines = [
  ...lines.slice(0, 604),
  lines[624],
  ...lines.slice(625)
];

fs.writeFileSync(path, newLines.join('\n'));
console.log('Fixed');
