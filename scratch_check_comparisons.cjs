const fs = require('fs');
const content = fs.readFileSync('src/data/notesData.js', 'utf8');

// Let's check for comparisons in the file using regex
const regex = /comparisons\s*:\s*\[([\s\S]*?)\]/g;
let match;
while ((match = regex.exec(content)) !== null) {
    const compText = match[1];
    // Find criteria
    const criteriaRegex = /criteria\s*:\s*\[([\s\S]*?)\]/g;
    let critMatch;
    while ((critMatch = criteriaRegex.exec(compText)) !== null) {
        const items = critMatch[1].split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
        items.forEach(item => {
            if (item.length > 30) {
                console.log(`Long item (${item.length} chars): "${item}"`);
            }
        });
    }
}
