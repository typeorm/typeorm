export function replaceCodeBlankLinesWithComments(fileContent: string): {
    comment: string
    content: string
} {
    const comment = "// blank line " + String(Math.random())

    if (fileContent.includes(comment))
        return replaceCodeBlankLinesWithComments(fileContent)

    const includesCrlf = fileContent.includes("\r\n")

    if (includesCrlf) fileContent = fileContent.split("\r\n").join("\n")

    return {
        comment,
        content: fileContent
            .split("\n")
            .map((line) => {
                if (line.trim().length === 0) return comment

                return line
            })
            .join(includesCrlf ? "\r\n" : "\n"),
    }
}
