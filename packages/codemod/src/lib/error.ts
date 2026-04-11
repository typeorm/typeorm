import { colors } from "./colors"

export const fail = (message: string, beforeExit?: () => void): never => {
    console.error(colors.red(`Error: ${message}\n`))
    beforeExit?.()
    process.exit(1)
}
