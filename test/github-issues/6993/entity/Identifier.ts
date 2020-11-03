import { PrimaryColumn } from "../../../../src";

// A non cryptographically accurate UUIDv4 mock function
// https://stackoverflow.com/a/2117523/7353602
export function uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (
        c
    ) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export class Identifier {
    private readonly uuid: string;

    @PrimaryColumn()
    get id(): string {
        return this.uuid;
    }

    constructor(uuid?: string) {
        this.uuid = uuid ? uuid : uuidv4();
    }

    static createFromMap(map: any): Identifier {
        return new Identifier(map["id"]);
    }
}
