// Presentation only: rotate the geographic circuit, then project its ground plane.
// No individual corner is moved. The browser uses this same transform.
const fs = require('node:fs');
const sharp = require('sharp');
const route = require('../src/content/journey-route.json');
const angle = -25 * Math.PI / 180;
const raw = ([x,y]) => [x*Math.cos(angle)-y*Math.sin(angle), (x*Math.sin(angle)+y*Math.cos(angle))*.86];
const points = route.points.map(raw);
const minX = Math.min(...points.map(p=>p[0])), minY = Math.min(...points.map(p=>p[1]));
const scale = 1165/(Math.max(...points.map(p=>p[0]))-minX);
const project = p => {const [x,y]=raw(p); return [390+(x-minX)*scale, 125+(y-minY)*scale];};
const d = route.points.map((p,i)=>(i?'L':'M')+project(p).join(' ')).join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1672" height="941"><rect width="1672" height="941" fill="#0b1916"/><path d="${d}" fill="none" stroke="#756d51" stroke-width="34" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#f1c689" stroke-width="22" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#303436" stroke-width="18" stroke-linejoin="round"/></svg>`;
sharp(Buffer.from(svg)).png().toFile('docs/verification/spa-scene-guide.png');
console.log({scale,minX,minY,positions:route.positions.map(project), height: Math.max(...points.map(p=>p[1]))*scale-minY*scale});
