const fs = require('fs');

const data = JSON.parse(fs.readFileSync('/Users/ahnaguib/Desktop/Mode 1.tokens.json', 'utf8'));

const colors = {};

function traverse(obj, prefix = '') {
  for (const key in obj) {
    if (obj[key].$type === 'color') {
      const name = key.replace(' ⭐', '').replace(/[^a-zA-Z0-9]/g, '');
      colors[`${prefix}${name}`] = obj[key].$value.hex;
    } else if (typeof obj[key] === 'object' && obj[key] !== null && !obj[key].$type) {
      traverse(obj[key], prefix === '' ? key + '_' : prefix + key + '_');
    }
  }
}

traverse(data);

console.log(JSON.stringify(colors, null, 2));

const tsContent = `// Automatically generated from Mode 1.tokens.json

export const colors = ${JSON.stringify(colors, null, 2)};
`;

fs.mkdirSync('src/theme', { recursive: true });
fs.writeFileSync('src/theme/colors.ts', tsContent);
console.log('Colors written to src/theme/colors.ts');
