import { colors } from "./colors"

const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]

export interface Spinner {
    update: (text: string | (() => string)) => void
    stop: (text?: string) => void
}

export const createSpinner = (text: string | (() => string)): Spinner => {
    if (!process.stderr.isTTY) {
        return {
            update() {},
            stop(finalText?: string) {
                if (finalText) process.stderr.write(`${finalText}\n`)
            },
        }
    }

    let i = 0
    let getText = typeof text === "function" ? text : () => text
    const clear = () => process.stderr.write(`\r\x1b[K`)

    const render = () => {
        clear()
        process.stderr.write(`${colors.brightGreen(frames[i])} ${getText()}`)
        i = (i + 1) % frames.length
    }

    render()
    const timer = setInterval(render, 100)

    return {
        update(newText: string | (() => string)) {
            getText = typeof newText === "function" ? newText : () => newText
        },
        stop(finalText?: string) {
            clearInterval(timer)
            clear()
            if (finalText) process.stderr.write(`${finalText}\n`)
        },
    }
}
