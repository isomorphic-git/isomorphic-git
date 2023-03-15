document.addEventListener('DOMContentLoaded', function () {
  let announcement = '#BlackLivesMatter #DefundThePolice'
  if (announcement) {
    let div = document.createElement('div')
    div.style.background = 'rgba(0,0,0)' // 'rgba(255,229,100)'
    div.style.textAlign = 'center'
    div.style.color = 'white' // 'black'
    div.style.fontSize = '20px'
    div.style.lineHeight = '2em'
    div.style.maxHeight = 'fit-content'
    div.innerHTML = announcement
    let parent = document.getElementsByClassName('navPusher')[0]
    parent.insertBefore(div, parent.firstChild)
  }
})