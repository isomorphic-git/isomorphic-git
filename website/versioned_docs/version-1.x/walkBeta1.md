---
id: version-1.x-walkBeta1
original_id: walkBeta1
---

This command has been replaced by [walk](./walk). Automatically navigating in <span id="navigating-countdown">3</span>...

<script>
var navigatingCountdown = 3
setInterval(function () {
  document.getElementById('navigating-countdown').innerText = navigatingCountdown--
  if (navigatingCountdown === 0) {
    window.location.pathname = window.location.pathname.replace('walkBeta1', 'walk')
  }
}, 1000)
</script>
