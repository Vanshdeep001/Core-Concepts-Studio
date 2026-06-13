const fs = require('fs');
const content = fs.readFileSync('src/data/notesData.js', 'utf8');

const keyRegex = /'([^']+)'\s*:\s*\{\s*title:\s*'([^']+)'/g;
let match;
while ((match = keyRegex.exec(content)) !== null) {
    console.log(`Key: "${match[1]}", Title: "${match[2]}"`);
}
