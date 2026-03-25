import { colors } from "./colors"

export const highlight = (text: string): string =>
    text.replace(/`([^`]+)`/g, (_, content: string) => colors.dim(content))
