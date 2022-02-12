import { Name, NameEntitySchema } from "./Name";
import { EntitySchema } from "../../../../../../src";

export class User {
    id: string;
    name: Name;
    isActive: boolean;
}

export const UserEntitySchema = new EntitySchema<User>({
    name: User.name,
    target: User,
    columns: {
        id: {
            primary: true,
            generated: "uuid",
            type: "uuid"
        },
        isActive: {
            type: "boolean"
        }
    },
    embeddeds: {
        name: {
            schema: NameEntitySchema,
            prefix: "name_",
        },
    }
});
