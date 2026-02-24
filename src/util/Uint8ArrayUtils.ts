const isBuffer = (value: unknown): value is Buffer =>
    typeof Buffer !== "undefined" && Buffer.isBuffer(value)

export const isUint8Array = (value: unknown): value is Uint8Array => {
    if (value instanceof Uint8Array) {
        return true
    }

    if (!ArrayBuffer.isView(value)) {
        return false
    }

    return Object.prototype.toString.call(value) === "[object Uint8Array]"
}

export const areUint8ArraysEqual = (
    left: Uint8Array,
    right: Uint8Array,
): boolean => {
    if (left === right) {
        return true
    }

    if (isBuffer(left) && isBuffer(right)) {
        return left.equals(right)
    }

    if (left.byteLength !== right.byteLength) {
        return false
    }

    for (let index = 0; index < left.byteLength; index++) {
        if (left[index] !== right[index]) {
            return false
        }
    }

    return true
}

const HEX_LOOKUP_TABLE = Array.from({ length: 256 }, (_, i) =>
    i.toString(16).padStart(2, "0"),
)
export const uint8ArrayToHex = (value: Uint8Array) => {
    let hex = ""
    for (let index = 0; index < value.length; index++) {
        hex += HEX_LOOKUP_TABLE[value[index]]
    }
    return hex
}
