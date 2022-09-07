const mixin = (target: any, source: any) => {
    target = target || {}
    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key]
        }
    }
    return target
}

export default mixin
