// Escape special characters in regular expressions
// Per https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Escaping
const ESCAPE_REGEXP = /[.*+\-?^${}()|[\]\\]/g
export const escapeRegExp = (s: string) => s.replace(ESCAPE_REGEXP, "\\$&")
