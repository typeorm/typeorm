import type { ValueTransformer } from "../../../../../src"

export class TrimTransformer implements ValueTransformer {
    to(value?: string) {
        return typeof value === "string" ? value.trim() : value
    }

    from(value?: string) {
        return typeof value === "string" ? value.trim() : value
    }
}
