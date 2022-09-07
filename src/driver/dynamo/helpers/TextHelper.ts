export const poundToUnderscore = (text: string) => {
    text = text || ""
    return text.replace(/#/g, "_")
}
