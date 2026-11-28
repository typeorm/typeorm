import type { ValueTransformer } from "../../../src"

export const idTransformer: ValueTransformer = {
    from: (value: number | null) => (value == null ? value : String(value)),
    to: (value: string | null | undefined) =>
        value == null ? value : Number(value),
}

export const prefixedIdTransformer: ValueTransformer = {
    from: (value: number | null) => (value == null ? value : `a${value}`),
    to: (value: string | null | undefined) =>
        value == null ? value : Number(value.slice(1)),
}
