// Karma configuration

module.exports = function (config) {
  config.set(
    process.env.CI ? require('./karma.conf.ci') : require('./karma.conf.local')
  )
}
