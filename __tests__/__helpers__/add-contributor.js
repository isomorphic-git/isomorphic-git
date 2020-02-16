var { execSync } = require('child_process')

var inquirer = require('inquirer')
inquirer
  .prompt([
    {
      type: 'input',
      name: 'username',
      message: 'GitHub username:',
    },
    {
      type: 'checkbox',
      name: 'contributions',
      message: 'Contribution type(s):',
      default: ['code', 'test', 'doc'],
      choices: [
        {
          value: 'code',
          name: 'Code',
        },
        {
          value: 'doc',
          name: 'Documentation',
        },
        {
          value: 'test',
          name: 'Tests',
        },
        {
          value: 'question',
          name: 'Answering Questions',
        },
        {
          value: 'bug',
          name: 'Bug reports',
        },
        {
          value: 'blog',
          name: 'Blogposts',
        },
        {
          value: 'business',
          name: 'Business Development',
        },
        {
          value: 'content',
          name: 'Content (e.g. website copy)',
        },
        {
          value: 'design',
          name: 'Design',
        },
        {
          value: 'example',
          name: 'Examples',
        },
        {
          value: 'eventOrganizing',
          name: 'Event Organizers',
        },
        {
          value: 'fundingFinding',
          name: 'Funding/Grant Finders',
        },
        {
          value: 'ideas',
          name: 'Ideas & Planning',
        },
        {
          value: 'infra',
          name: 'Infrastructure',
        },
        {
          value: 'maintenance',
          name: 'Maintenance',
        },
        {
          value: 'platform',
          name: 'Packaging',
        },
        {
          value: 'plugin',
          name: 'Plugin/utility libraries',
        },
        {
          value: 'projectManagement',
          name: 'Project Management',
        },
        {
          value: 'review',
          name: 'Reviewed Pull Requests',
        },
        {
          value: 'security',
          name: 'Security',
        },
        {
          value: 'tool',
          name: 'Tools',
        },
        {
          value: 'translation',
          name: 'Translation',
        },
        {
          value: 'tutorials',
          name: 'Tutorials',
        },
        {
          value: 'talk',
          name: 'Talks',
        },
        {
          value: 'userTesting',
          name: 'User Testing',
        },
        {
          value: 'video',
          name: 'Videos',
        },
      ],
    },
  ])
  .then(answers => {
    console.log(
      '\n(This may take a moment to download the add-contributors-cli.)\n'
    )
    var cmd = `npx all-contributors-cli add ${
      answers.username
    } ${answers.contributions.join(',')}`
    console.log(cmd)
    execSync(
      `npx all-contributors-cli add ${
        answers.username
      } ${answers.contributions.join(',')}`,
      { encoding: 'utf8' }
    )
    console.log('\nOK, all done, added a commit and everything.')
  })
