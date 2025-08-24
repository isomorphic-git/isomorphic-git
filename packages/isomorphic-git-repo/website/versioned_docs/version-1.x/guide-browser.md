---
id: version-1.x-browser
title: Browser Quick Start
sidebar_label: Browser Quick Start
original_id: browser
---

This page has moved to [Quick Start](./quickstart). Automatically navigating in <span id="navigating-countdown">3</span>...

<script>
var navigatingCountdown = 3
setInterval(function () {
  document.getElementById('navigating-countdown').innerText = navigatingCountdown--
  if (navigatingCountdown === 0) {
    window.location.pathname = window.location.pathname.replace('browser', 'quickstart')
  }
}, 1000)
</script>
