import { colors } from "./colors"

export const highlight = (text: string): string =>
    text.replaceAll(/`([^`]+)`/g, (_, content: string) => colors.dim(content))
