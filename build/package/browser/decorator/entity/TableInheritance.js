import { getMetadataArgsStorage } from "../../globals";
/**
 * Sets for entity to use table inheritance pattern.
 */
export function TableInheritance(options) {
    return function (target) {
        getMetadataArgsStorage().inheritances.push({
            target: target,
            pattern: options && options.pattern ? options.pattern : "STI",
            column: options && options.column
                ? typeof options.column === "string"
                    ? { name: options.column }
                    : options.column
                : undefined,
        });
    };
}

//# sourceMappingURL=TableInheritance.js.map
