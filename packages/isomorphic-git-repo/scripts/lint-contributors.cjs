const fs = require('fs');
const path = require('path');

// --- Configuration ---
const JSON_FILE_NAME = '.all-contributorsrc';
const INDENTATION = 2;
// --- End Configuration ---

const filePath = path.join(__dirname, JSON_FILE_NAME);

if (!fs.existsSync(filePath)) {
  console.error(`Error: File not found at '${filePath}'`);
  process.exit(1);
}

try {
  // 1. Read and parse the file
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const parsedJson = JSON.parse(fileContent);

  // 2. Destructure into the two parts we need to format differently
  const { contributors, ...allKeys } = parsedJson;

  // --- Start building the final output string ---

  // 3. Stringify the main keys with pretty-printing, but remove the final '}'
  //    so we can append the contributors block.
  let finalJsonString = JSON.stringify(allKeys, null, INDENTATION).slice(0, -1).trim();

  // 4. Add the 'contributors' key and its opening bracket.
  //    Only add a comma if there were other keys before it.
  if (Object.keys(allKeys).length > 0) {
    finalJsonString += `,\n${' '.repeat(INDENTATION)}"contributors": [\n`;
  } else {
    // Handle edge case where contributors is the only key
    finalJsonString = `{\n${' '.repeat(INDENTATION)}"contributors": [\n`;
  }

  // 5. Create the single-line entries for the contributors array.
  const contributorLines = contributors.map(c => {
    const singleLineJson = JSON.stringify(c);
    // Indent each entry one level deeper
    return `${' '.repeat(INDENTATION * 2)}${singleLineJson}`;
  });

  // 6. Join the contributor lines with commas and add them to the main string.
  finalJsonString += contributorLines.join(',\n');

  // 7. Close the contributors array and the main JSON object.
  finalJsonString += `\n${' '.repeat(INDENTATION)}]\n}\n`;

  // 8. Write the completely reconstructed string back to the file.
  fs.writeFileSync(filePath, finalJsonString, 'utf8');

  console.log(`✅ Successfully rebuilt and formatted '${JSON_FILE_NAME}'.`);

} catch (error) {
  console.error('An error occurred:', error);
  process.exit(1);
}