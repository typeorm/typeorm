import { EntitySchema } from "../../../../../../src";

export class Name {
    first: string;
    last: string;
}

export const NameEntitySchema = new EntitySchema<Name>({
    name: "name",
    target: Name,
    columns: {
        first: {
            type: "varchar"
        },
        last: {
            type: "varchar"
        }
    },
    indices: [
        {
            columns: ["first"],
        },
    ],
});
