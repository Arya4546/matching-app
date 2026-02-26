const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
    { regex: /#4AC1E0/gi, replace: '#00C194' },
    { regex: /#36A5C1/gi, replace: '#00AB84' },
    { regex: /#2EAAA6/gi, replace: '#00C194' },
    { regex: /rgba\(46,\s*170,\s*166/gi, replace: 'rgba(0, 193, 148' }
];

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.css') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let changed = false;
            for (const r of replacements) {
                if (r.regex.test(content)) {
                    content = content.replace(r.regex, r.replace);
                    changed = true;
                }
            }
            if (changed) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

processDir(srcDir);
