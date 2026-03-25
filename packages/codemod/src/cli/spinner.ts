import { colors } from "./colors"

const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]

export interface Spinner {
    update: (text: string) => void
    stop: (text?: string) => void
}

export const createSpinner = (text: string): Spinner => {
    let i = 0
    const clear = () => process.stderr.write(`\r\x1b[K`)

    const render = () => {
        clear()
        process.stderr.write(`${colors.brightGreen(frames[i])} ${text}`)
        i = (i + 1) % frames.length
    }

    render()
    const timer = setInterval(render, 80)

    return {
        update(newText: string) {
            text = newText
        },
        stop(finalText?: string) {
            clearInterval(timer)
            clear()
            if (finalText) process.stderr.write(`${finalText}\n`)
        },
    }
}
