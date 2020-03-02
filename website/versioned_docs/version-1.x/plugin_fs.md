---
id: version-1.x-plugin_fs
original_id: plugin_fs
---

This plugin has been replaced by the [fs](./fs) client. Automatically navigating in <span id="navigating-countdown">3</span>...

<script>
var navigatingCountdown = 3
setInterval(function () {
  document.getElementById('navigating-countdown').innerText = navigatingCountdown--
  if (navigatingCountdown === 0) {
    window.location.pathname = window.location.pathname.replace('plugin_fs', 'fs')
  }
}, 1000)
</script>
