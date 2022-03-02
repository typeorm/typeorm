export const commonUtils = {
    isEmpty(object: any) {
        if (Array.isArray(object)) {
            return object === null || object.length === 0;
        }
        return typeof object === "undefined" || object === null || object === "" || JSON.stringify(object) === "{}";
    },
    isNotEmpty(object: any) {
        if (Array.isArray(object)) {
            return object !== null && object.length > 0;
        }
        return typeof object !== "undefined" && object !== null && object !== "" && JSON.stringify(object) !== "{}";
    }
};
