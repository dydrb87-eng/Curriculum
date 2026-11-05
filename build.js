const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const jsDir = path.join(srcDir, 'js');
const templatePath = path.join(srcDir, 'index.template.html');

if (!fs.existsSync(templatePath)) {
  console.error('Template not found:', templatePath);
  process.exit(1);
}

const template = fs.readFileSync(templatePath, 'utf8');

// src/js 안의 파일들을 번호순 정렬하여 순차 결합
const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js')).sort();

let combinedJs = '';
jsFiles.forEach(file => {
  const content = fs.readFileSync(path.join(jsDir, file), 'utf8');
  combinedJs += '\n' + content + '\n';
});

const finalHtml = template.replace('<!-- INJECT_SCRIPTS -->', combinedJs);

fs.writeFileSync('index.html', finalHtml, 'utf8');
fs.writeFileSync('gas_index.html', finalHtml, 'utf8');

console.log('Build completed successfully!');
