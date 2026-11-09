import fs from 'fs';
import path from 'path';

const scriptPath = path.resolve('client/assets/js/script.js');
const content = fs.readFileSync(scriptPath, 'utf8');
const lines = content.split('\n');
console.log('Total lines in script.js:', lines.length);

const fetchCalls = [];
const eventListeners = [];
const functions = [];

lines.forEach((line, idx) => {
  const lineNum = idx + 1;
  if (line.includes('fetch(')) {
    fetchCalls.push({ lineNum, text: line.trim() });
  }
  if (line.includes('.addEventListener(')) {
    eventListeners.push({ lineNum, text: line.trim() });
  }
  if (line.match(/(function\s+\w+|const\s+\w+\s*=\s*(async\s*)?\([^)]*\)\s*=>)/)) {
    functions.push({ lineNum, text: line.trim().substring(0, 80) });
  }
});

console.log('\n--- FETCH CALLS (' + fetchCalls.length + ') ---');
fetchCalls.forEach(f => console.log(`L${f.lineNum}: ${f.text}`));

console.log('\n--- EVENT LISTENERS (' + eventListeners.length + ') ---');
eventListeners.slice(0, 30).forEach(e => console.log(`L${e.lineNum}: ${e.text.substring(0, 80)}`));

console.log('\n--- KEY FUNCTIONS (' + functions.length + ') ---');
functions.slice(0, 40).forEach(f => console.log(`L${f.lineNum}: ${f.text}`));

