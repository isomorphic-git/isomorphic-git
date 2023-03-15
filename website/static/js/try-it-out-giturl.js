import http from './isomorphic-git/http/web/index.js'

document.addEventListener('DOMContentLoaded', function listener () {
  document.removeEventListener('DOMContentLoaded', listener)
  let $output = document.getElementById('try-it-output')
  let $input = document.getElementById('giturl_input')
  let $button = document.getElementById('giturl_button')
  const change = async function change (event) {
    let value = $input.value
    if (!value.endsWith('.git')) value += '.git'
    let info = await git.getRemoteInfo({
      http,
      url: value,
      corsProxy: 'https://cors.isomorphic-git.org'
    })
    const limit = 1000;
    if (info.refs.tags) {
      let $tags = document.getElementById('giturl_tags')
      let tagstext = Object.keys(info.refs.tags).join(', ')
      $tags.innerText = tagstext.slice(0, limit)
    }
    if (info.refs.heads) {
      let $branches = document.getElementById('giturl_branches')
      let branchestext = Object.keys(info.refs.heads).join(', ')
      $branches.innerText = branchestext.slice(0, limit)
    }
    $output.classList.add('show')
  }
  if ($input && $button) {
    $input.addEventListener('change', change)
    $button.addEventListener('click', change)
  }
})
