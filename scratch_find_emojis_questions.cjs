const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/modules/interview/interviewQuestions.js');
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1FFFF}]/u;

lines.forEach((line, index) => {
    if (emojiRegex.test(line)) {
        console.log(`  L${index + 1}: ${line.trim()}`);
    }
});
