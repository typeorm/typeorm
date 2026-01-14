export const isUint8Array = (value: unknown): value is Uint8Array =>
    value instanceof Uint8Array

export const areUint8ArraysEqual = (
    left: Uint8Array,
    right: Uint8Array,
): boolean => {
    if (left.byteLength !== right.byteLength) return false
    for (let index = 0; index < left.byteLength; index++) {
        if (left[index] !== right[index]) return false
    }
    return true
}

export const uint8ArrayToHex = (value: Uint8Array): string => {
    let hex = ""
    for (let index = 0; index < value.length; index++) {
        hex += value[index].toString(16).padStart(2, "0")
    }
    return hex
}
