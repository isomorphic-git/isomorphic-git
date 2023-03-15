#!/usr/bin/env node
var message = process.argv.slice(2).join(' ')
var TweetTweet = require('tweet-tweet')

console.log('Tweeting:', '"' + message + '"')

var tweet = TweetTweet({
  consumerKey: process.env.TWITTER_CONSUMER_KEY,
  consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
})

let commitMessage = process.env.BUILD_SOURCEVERSIONMESSAGE
commitMessage = commitMessage ? '\n\n' + commitMessage.split('\n')[0] : ''

tweet(message + commitMessage, function(err, response) {
  if (err) return console.log(err)
  console.log('Tweet id:', response.id)
})
