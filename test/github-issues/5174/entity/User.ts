import { Entity, ManyToOne, PrimaryColumn } from "@typeorm/core";
import { Role } from "./Role";

@Entity()
export class User {

    @PrimaryColumn()
    id: number;

    @ManyToOne(_ => Role, role => role.users)
    role: Role;

}
