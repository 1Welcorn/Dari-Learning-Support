const fs = require('fs');
const path = 'src/components/features/Activities.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = /const normalizeEmbedUrl = \(rawUrl: string\): string => \{\s+const trimmed = rawUrl\.trim\(\);\s+if \(!trimmed\) return '';\s+const withProtocol = \/\^https\?:\/\/\/.test\(trimmed\) \? trimmed : `https:\/\/\${trimmed}`;/;

const replacement = `const normalizeEmbedUrl = (rawUrl: string): string => {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  // Se for um código de iframe completo, tenta extrair o src
  if (trimmed.startsWith('<iframe')) {
    const srcMatch = trimmed.match(/src=["'](.*?)["']/);
    if (srcMatch && srcMatch[1]) return srcMatch[1];
  }

  const withProtocol = /^https?:\\/\\//i.test(trimmed) ? trimmed : \`https://\${trimmed}\`;`;

if (target.test(content)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content);
    console.log('Success');
} else {
    console.log('Target not found');
}
