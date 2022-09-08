export const mixin = (target: any, source: any) => {
    target = target || {}
    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key]
        }
    }
    return target
}

export const isEmpty = (object: any) => {
    if (Array.isArray(object)) {
        return object === null || object.length === 0
    }
    return (
        typeof object === "undefined" ||
        object === null ||
        object === "" ||
        JSON.stringify(object) === "{}"
    )
}

export const isNotEmpty = (object: any) => {
    if (Array.isArray(object)) {
        return object !== null && object.length > 0
    }
    return (
        typeof object !== "undefined" &&
        object !== null &&
        object !== "" &&
        JSON.stringify(object) !== "{}"
    )
}
