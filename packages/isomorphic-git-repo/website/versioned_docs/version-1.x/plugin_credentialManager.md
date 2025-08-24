---
id: version-1.x-plugin_credentialManager
original_id: plugin_credentialManager
---

This plugin has been replaced by the [onAuth](./onAuth) callback. Automatically navigating in <span id="navigating-countdown">3</span>...

<script>
var navigatingCountdown = 3
setInterval(function () {
  document.getElementById('navigating-countdown').innerText = navigatingCountdown--
  if (navigatingCountdown === 0) {
    window.location.pathname = window.location.pathname.replace('plugin_credentialManager', 'onAuth')
  }
}, 1000)
</script>
