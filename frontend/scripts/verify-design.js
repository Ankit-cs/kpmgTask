const fs = require('fs');
const path = require('path');

const COMPONENTS_DIR = path.join(__dirname, '../components');

// Allowed hex codes based on DESIGN.md
const ALLOWED_HEX = [
    '#000000', '#111111', '#222222', '#FFFFFF', '#A3A3A3', '#EDFF66', '#EDFF6633', '#333333'
];

function scanDirectory(dir) {
    let files = [];
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
            files = files.concat(scanDirectory(fullPath));
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.jsx')) {
            files.push(fullPath);
        }
    }
    return files;
}

let hasErrors = false;

const files = scanDirectory(COMPONENTS_DIR);
for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    
    // Find all hex codes in the file
    const hexRegex = /#[0-9a-fA-F]{3,8}/g;
    let match;
    let lineNum = 1;
    let lastIndex = 0;
    
    while ((match = hexRegex.exec(content)) !== null) {
        // Calculate line number
        const upToMatch = content.substring(lastIndex, match.index);
        lineNum += (upToMatch.match(/\n/g) || []).length;
        lastIndex = match.index;
        
        const hex = match[0].toUpperCase();
        if (!ALLOWED_HEX.includes(hex)) {
            console.error(`❌ Visual Drift Detected in ${file}:${lineNum}`);
            console.error(`   Found unauthorized color: ${hex}`);
            console.error(`   Please use a color defined in DESIGN.md`);
            hasErrors = true;
        }
    }
}

if (hasErrors) {
    console.error("\n❌ Design verification failed.");
    process.exit(1);
} else {
    console.log("✅ All UI components adhere to DESIGN.md tokens.");
    process.exit(0);
}
