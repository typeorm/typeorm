const wrap = (code: string) => (s: string) => `\x1b[${code}m${s}\x1b[0m`

export const colors = {
    bold: wrap("1"),
    dim: wrap("2"),
    red: wrap("31"),
    blue: wrap("94"),
}
