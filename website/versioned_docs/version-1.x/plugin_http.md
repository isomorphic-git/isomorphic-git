---
id: version-1.x-plugin_http
original_id: plugin_http
---

This plugin has been replaced by the [http](./http) client. Automatically navigating in <span id="navigating-countdown">3</span>...

<script>
var navigatingCountdown = 3
setInterval(function () {
  document.getElementById('navigating-countdown').innerText = navigatingCountdown--
  if (navigatingCountdown === 0) {
    window.location.pathname = window.location.pathname.replace('plugin_http', 'http')
  }
}, 1000)
</script>
