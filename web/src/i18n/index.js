import en from './en.js'

const messages = { en }

let locale = 'en'

export function setLocale(code) {
  if (messages[code]) locale = code
}

/**
 * Look up a translation 
 */
export function t(key, params = {}) {
  const value = key.split('.').reduce((obj, part) => obj?.[part], messages[locale])
  if (typeof value !== 'string') return key
  return value.replace(/\{(\w+)\}/g, (_, name) => params[name] ?? `{${name}}`)
}
