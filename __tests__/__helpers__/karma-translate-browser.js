module.exports = function translateBrowser (fullname) {
  if (fullname.startsWith('X ')) {

  } else if (fullname.startsWith('HeadlessChrome')) {
    return 'ChromeHeadlessNoSandbox'
  } else if (fullname.startsWith('Firefox')) {
    return 'FirefoxHeadless'
  } else if (fullname.startsWith('Edge')) {
    return 'sl_edge'
  } else if (fullname.startsWith('Mobile Safari')) {
    return 'sl_ios_safari'
  } else if (fullname.startsWith('Chrome Mobile')) {
    return 'sl_android_chrome'
  } else if (fullname.startsWith('Safari')) {
    return 'sl_safari'
  } else {
    console.log('translateBrowser ERROR', fullname)
  }
}
