import fs from 'fs';
import path from 'path';

const clientDir = path.resolve('client');
const pages = [
  'index.html',
  'pages/diagnosis.html',
  'pages/crop-recommendation.html',
  'pages/fertilizer-recommendation.html',
  'pages/soil-analysis.html',
  'pages/pest-detection.html',
  'pages/weather.html',
  'pages/market.html',
  'pages/chat-expert.html',
  'pages/nearby-stores.html'
];

pages.forEach(p => {
  const filePath = path.join(clientDir, p);
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`\n=================== ${p} ===================`);
  const inlineScripts = [...content.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  inlineScripts.forEach((s, idx) => {
    console.log(`--- Script #${idx+1} (${s.length} chars) ---`);
    const fetchLines = s.split('\n').filter(l => l.includes('fetch(') || l.includes('http') || l.includes('API') || l.includes('api'));
    console.log('API/fetch lines in inline script:', fetchLines.slice(0, 10));
    // Print first 20 lines of the script
    const preview = s.split('\n').slice(0, 25).join('\n');
    console.log('Preview:\n' + preview);
  });
});

