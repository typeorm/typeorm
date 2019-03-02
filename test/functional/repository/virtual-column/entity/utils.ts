import { DatabaseType } from "../../../../../src";

export function concat(type: DatabaseType, ...strings: string[]) {
    switch (type) {
        case "postgres":
        case "oracle":
        case "sqlite":
            return strings.join("||");
        case "mysql":
        case "mariadb":
            return "concat(" + strings.join(",") + ")";
        default:
            throw new Error(`dialect '${type}' still not implement 'concat()'`);
    }
}

export function summary(type: DatabaseType, body: string, max_length: number) {
    switch (type) {
        //case "oracle":
        case "sqlite":
        //case "mysql":
        //case "mariadb":
            return concat(type, `substr(${body}, 0, ${max_length})`, "'...'");
        case "postgres":
            //return concat(type, `substring(${body}, 0, ${max_length})`, "'...'");
        default:
            throw new Error(`dialect '${type}' still not implement 'summary()'`);
    }
}

