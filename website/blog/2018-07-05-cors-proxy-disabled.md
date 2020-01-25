---
author: William Hilton
authorURL: https://twitter.com/wmhilton
authorFBID: 551965935
title: CORS proxy temporarily disabled
---

Since the start of the isomorphic-git project, I have hosted an instance of [cors-buster proxy](https://www.npmjs.com/package/cors-buster) to
get around the fact that none of the major git hosting sites use CORS headers
that would allow browsers to clone. This proxy is free, [open source](https://github.com/wmhilton/cors-buster), and
easy to [install](https://www.npmjs.com/package/cors-buster). 

Unfortunately, this proxy also used a whopping 5 TERABYTES of bandwidth last month, and I got hit with a
$500 charge from my favorite hosting service ever [now.sh](https://zeit.co/now). (They say they are working
on making bandwidth usage more transparent... it would have been good to get a notification....)
Either a lot of cloning has been going on (which is GREAT!) or somebody has discovered the proxy can be abused.
Either way, paying $500/month is not within isomorphic-git's budget.

(You could change that! Sponsor us on [OpenCollective](https://opencollective.com/isomorphic-git)!)

So for now I've had to suspend the proxy until I find time to write some spiffy bandwidth-limiting logic for it.

Don't let this stop you from playing with isomorphic-git! Clone https://github.com/wmhilton/cors-buster, or npm install it, or
deploy your own instance on Now.

**Update: ZEIT has donated credit to cover this month's surprise bandwidth, plus some extra!** Aren't they great?
