import type { ValueTransformer } from "../../../src"

export const idTransformer: ValueTransformer = {
    from: (value: number | null) => (value == null ? value : String(value)),
    to: (value: string | null | undefined) =>
        value == null ? value : Number(value),
}
