const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/modules/interview/interviewQuestions.js');
const content = fs.readFileSync(file, 'utf8');
const { QUESTIONS_DATA } = require(file);

for (const key in QUESTIONS_DATA) {
    const cat = QUESTIONS_DATA[key];
    console.log(`Key: ${key}`);
    console.log(`  Title: ${cat.title}`);
    console.log(`  Desc: ${cat.description}`);
    console.log(`  Icon: ${cat.icon}`);
}
