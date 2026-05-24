import fs from 'fs';

const filePath = 'src/data/products.ts';
const content = fs.readFileSync(filePath, 'utf-8');

// Find the start and end of the rawProducts array
const arrayStartMarker = 'const rawProducts: Product[] = [';
const arrayEndMarker = '];';

const startIndex = content.indexOf(arrayStartMarker);
if (startIndex === -1) {
    console.error('Could not find start marker');
    process.exit(1);
}

const arrayContentStart = startIndex + arrayStartMarker.length;
// We need to find the matching closing bracket for the array.
// Since the array ends with "];" followed by other exports, we can look for "];\n\nexport const products".
const arrayEndIndex = content.indexOf('];\n\nexport const products', arrayContentStart);

if (arrayEndIndex === -1) {
    console.error('Could not find end marker');
    process.exit(1);
}

const arrayText = content.substring(arrayContentStart, arrayEndIndex);

// The arrayText contains multiple objects like { ... }, { ... }
// We can split them by "  }," (the comma at the end of each object)
// But a safer way is to use a regex to match each object.
// Each object starts with "  {" and ends with "  }".

const objects = [];
let bracketCount = 0;
let currentObject = '';
let inString = false;

for (let i = 0; i < arrayText.length; i++) {
    const char = arrayText[i];
    if (char === '"' && arrayText[i-1] !== '\\') {
        inString = !inString;
    }
    
    if (!inString) {
        if (char === '{') bracketCount++;
        if (char === '}') bracketCount--;
    }
    
    currentObject += char;
    
    if (bracketCount === 0 && currentObject.trim().endsWith('}')) {
        objects.push(currentObject.trim());
        currentObject = '';
        // Skip potential comma
        while (i + 1 < arrayText.length && (arrayText[i+1] === ',' || arrayText[i+1] === '\n' || arrayText[i+1] === ' ')) {
            i++;
        }
    }
}

console.log(`Found ${objects.length} products total.`);

const filteredObjects = objects.filter(objText => {
    // Check if "perfume" is in the object text (case insensitive)
    // We should be careful to only check name and category fields if possible, 
    // but the user said "remove all perfumes", so any perfume reference usually means it's a perfume.
    // However, some descriptions might mention "scent of perfume" or something.
    // Let's parse it to be safe.
    try {
        // Simple "fake" parse: find name and category
        const nameMatch = objText.match(/"name":\s*"(.*)"/);
        const categoryMatch = objText.match(/"category":\s*"(.*)"/);
        
        const name = nameMatch ? nameMatch[1].toLowerCase() : '';
        const category = categoryMatch ? categoryMatch[1].toLowerCase() : '';
        
        const isPerfume = name.includes('perfume') || category.includes('perfume') || category.includes('fragrancia');
        return !isPerfume;
    } catch (e) {
        return true; // Keep if we can't tell
    }
});

console.log(`Remaining products: ${filteredObjects.length}`);
console.log(`Removed ${objects.length - filteredObjects.length} perfumes.`);

const newArrayText = '\n  ' + filteredObjects.join(',\n  ') + '\n';
const newContent = content.substring(0, arrayContentStart) + newArrayText + content.substring(arrayEndIndex);

fs.writeFileSync(filePath, newContent);
console.log('File updated successfully.');
