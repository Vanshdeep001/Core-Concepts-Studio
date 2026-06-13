const fs = require('fs');
const path = require('path');

const filePath = 'd:\\OSlizer\\cpu-scheduler\\src\\modules\\interview\\InterviewVisualizations.jsx';
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
const targets = ['Ø', 'ß', 'ü', 'ì', 'Ý', 'à', 'Ü', 'ï', '¿', '½', ''];

lines.forEach((line, i) => {
    let found = false;
    targets.forEach(t => {
        if (line.includes(t)) {
            found = true;
        }
    });
    if (found) {
        console.log(`L${i+1}: ${line.trim()}`);
    }
});
