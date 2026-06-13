const fs = require('fs');
const path = require('path');

function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(filePath));
        } else {
            if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
                results.push(filePath);
            }
        }
    });
    return results;
}

const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1FFFF}]/u;

const files = getFiles(path.join(__dirname, 'src'));
files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    let fileHeaderShown = false;
    lines.forEach((line, index) => {
        if (emojiRegex.test(line)) {
            if (!fileHeaderShown) {
                console.log(`\n=== ${path.relative(__dirname, file)} ===`);
                fileHeaderShown = true;
            }
            console.log(`  L${index + 1}: ${line.trim()}`);
        }
    });
});
