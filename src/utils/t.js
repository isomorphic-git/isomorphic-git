import locale2 from 'locale2'
import i18n from 'simplest-i18n'

const locale = (() => {
  switch (locale2) {
    case 'en':
    case 'en-us':
      return 'en-us'
    default:
      return 'en-us'
  }
})()

export const t = i18n({
  locale,
  locales: ['en-us']
})
