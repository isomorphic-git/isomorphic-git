import { createInterface } from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import fs from 'fs';
import fsp from 'node:fs/promises';
import path from 'path';

// --- Configuration ---
const JSON_FILE_NAME = '../.all-contributorsrc';
const INDENTATION = 2;
// --- End Configuration ---

const choices = [
  { value: 'code', name: 'Code' }, { value: 'doc', name: 'Documentation' },
  { value: 'test', name: 'Tests' }, { value: 'question', name: 'Answering Questions' },
  { value: 'bug', name: 'Bug reports' }, { value: 'blog', name: 'Blogposts' },
  { value: 'business', name: 'Business Development' }, { value: 'content', name: 'Content' },
  { value: 'design', name: 'Design' }, { value: 'example', name: 'Examples' },
  { value: 'eventOrganizing', name: 'Event Organizers' }, { value: 'fundingFinding', name: 'Funding/Grant Finders' },
  { value: 'ideas', name: 'Ideas & Planning' }, { value: 'infra', name: 'Infrastructure' },
  { value: 'maintenance', name: 'Maintenance' }, { value: 'platform', name: 'Packaging' },
  { value: 'plugin', name: 'Plugin/utility libraries' }, { value: 'projectManagement', name: 'Project Management' },
  { value: 'review', name: 'Reviewed Pull Requests' }, { value: 'security', name: 'Security' },
  { value: 'tool', name: 'Tools' }, { value: 'translation', name: 'Translation' },
  { value: 'tutorials', name: 'Tutorials' }, { value: 'talk', name: 'Talks' },
  { value: 'userTesting', name: 'User Testing' }, { value: 'video', name: 'Videos' },
];

async function getAnswers() {
  const rl = createInterface({ input, output });
  const username = await rl.question('GitHub username: ');
  const printChoice = (choice, index) => console.log(`  ${index + 1}. ${choice.name}`);
  console.log('\nContribution type(s):');
  choices.forEach(printChoice);

  const defaultSelection = '1 2 3'; // Corresponds to code, doc, test
  const answer = await rl.question(`\nEnter numbers separated by spaces [${defaultSelection}]: `);
  rl.close();

  // Use the default if the user provided no input
  const userInput = answer.trim() === '' ? defaultSelection : answer;

  // Helpers for processing the user's input string
  const parseToIndex = (numStr) => parseInt(numStr, 10) - 1;
  const isValidIndex = (index) => choices[index]; // Relies on truthiness of the result
  const mapIndexToValue = (index) => choices[index].value;

  const contributions = userInput.split(/\s+/).map(parseToIndex).filter(isValidIndex).map(mapIndexToValue);

  return { username, contributions };
}

async function fetchGitHubProfile(username) {
  const response = await fetch(`https://api.github.com/users/${username}`);
  if (!response.ok) throw new Error(`GitHub user "${username}" not found.`);
  return response.json();
}

export async function replaceContributor(filePath, newContributorObject) {
  const loginToFind = newContributorObject.login;
  if (!loginToFind) {
    throw new Error('Contributor object must have a "login" property.');
  }
  const content = await fsp.readFile(filePath, 'utf8');
  const lines = content.split('\n');
  const searchString = `"login":"${loginToFind}"`;
  const lineIndex = lines.findIndex(line => line.includes(searchString));

  if (lineIndex === -1) { return false; }

  const indentation = lines[lineIndex].match(/^\s*/)[0] || '';
//   console.log("NEXT LINE ================",lines[lineIndex+1].trim())
  lines[lineIndex] = `${indentation}${JSON.stringify(newContributorObject)}${!lines[lineIndex+1].trim().endsWith(']') ? ',' : '' }`;
  await fsp.writeFile(filePath, lines.join('\n'), 'utf8');  
  return true;
}

async function main() {
  const filePath = path.join(process.cwd(), JSON_FILE_NAME);

  try {
    // 1. Get new contributor data from user and GitHub
    const { username, contributions } = await getAnswers();
    console.log(`\nFetching profile for ${username}...`);
    const githubData = await fetchGitHubProfile(username);
    
    const newContributor = {
      login: githubData.login,
      name: githubData.name || githubData.login,
      avatar_url: githubData.avatar_url,
      profile: githubData.html_url,
      contributions,
    };

    console.log('\n--- Generated Contributor JSON ---');
    console.log(JSON.stringify(newContributor, null, 2));

    // 2. Read the existing contributors file
    if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const parsedData = JSON.parse(fileContent);

    // Check if user already exists if yes replace inline.
    const existingContributor = parsedData.contributors.find(c => c.login === newContributor.login);
    if (parsedData.contributors.some(c => c.login === newContributor.login)) {
      console.warn(`\n⚠️ Warning: Contributor "${newContributor.login}" already exists in the file. merging contributions.`);
      newContributor.contributions =  [...new Set(newContributor.contributions).union(new Set(existingContributor.contributions))]
      await replaceContributor(filePath, newContributor);
      console.log("Updated:",{ newContributor });
      return;
    }

    // 3. Prepare the new single-line entry
    const singleLineEntry = JSON.stringify(newContributor);
    const indent = ' '.repeat(INDENTATION * 2);
    const entryWithIndent = `${indent}${singleLineEntry}`;

    // 4. Find the position of the last ']' to insert before it.
    const insertionPoint = fileContent.lastIndexOf(']');
    if (insertionPoint === -1) throw new Error(`Invalid format: Cannot find closing ']' in ${JSON_FILE_NAME}`);

    // 5. Split the file content at that point.
    const fileStart = fileContent.substring(0, insertionPoint);
    const fileEnd = fileContent.substring(insertionPoint);

    // 6. Decide if a comma is needed (if the array is not empty).
    const needsComma = parsedData.contributors.length > 0;
    const entryToInsert = needsComma 
      ? `,\n${entryWithIndent}` 
      : `\n${entryWithIndent}`;

    // 7. Assemble the new file content and write it back.
    const newFileContent = fileStart + entryToInsert + fileEnd;
    fs.writeFileSync(filePath, newFileContent, 'utf8');
    console.log(`\n✅ Successfully added "${newContributor.login}" to ${JSON_FILE_NAME}!`);

  } catch (error) {
    console.error(error)
    console.error(`\n❌ Error: ${error.message}`);
  }
}

main();