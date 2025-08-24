---
id: version-1.x-fastCheckout
original_id: fastCheckout
---

This command has been renamed to [checkout](./checkout). Automatically navigating in <span id="navigating-countdown">3</span>...

<script>
var navigatingCountdown = 3
setInterval(function () {
  document.getElementById('navigating-countdown').innerText = navigatingCountdown--
  if (navigatingCountdown === 0) {
    window.location.pathname = window.location.pathname.replace('fastCheckout', 'checkout')
  }
}, 1000)
</script>
