const fs = require('fs');
const path = 'src/components/features/Activities.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace height: '350px' with height: '550px'
content = content.replace(/height: '350px'/g, "height: '550px'");

// Replace footer padding
const cssPath = 'src/index.css';
let css = fs.readFileSync(cssPath, 'utf8');
css = css.replace(/padding: 10px 20px 30px 40px !important;/g, "padding: 10px 20px 10px 40px !important;");

fs.writeFileSync(path, content);
fs.writeFileSync(cssPath, css);
console.log('Fixed dimensions');
