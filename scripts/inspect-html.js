import fs from 'fs';
import path from 'path';

const clientDir = path.resolve('client');
const files = [
  'index.html',
  ...fs.readdirSync(path.join(clientDir, 'pages')).map(f => 'pages/' + f)
];

const report = [];

files.forEach(file => {
  const filePath = path.join(clientDir, file);
  if (!fs.existsSync(filePath) || !file.endsWith('.html')) return;
  const content = fs.readFileSync(filePath, 'utf8');

  const scripts = [...content.matchAll(/<script[^>]*src=["']([^"']+)["'][^>]*>/g)].map(m => m[1]);
  const inlineScripts = [...content.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1].length);
  const forms = [...content.matchAll(/<form[^>]*id=["']([^"']+)["'][^>]*>/g)].map(m => m[1]);
  const buttons = [...content.matchAll(/<button[^>]*id=["']([^"']+)["'][^>]*>/g)].map(m => m[1]);
  const inputs = [...content.matchAll(/<(?:input|select|textarea)[^>]*id=["']([^"']+)["'][^>]*>/g)].map(m => m[1]);

  report.push({
    file,
    scripts,
    inlineScriptCount: inlineScripts.length,
    inlineScriptLengths: inlineScripts,
    forms,
    buttons,
    inputs: inputs.slice(0, 15)
  });
});

console.log(JSON.stringify(report, null, 2));

