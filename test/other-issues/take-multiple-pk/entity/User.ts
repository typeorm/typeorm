import { Column, Entity, JoinTable, ManyToMany, PrimaryColumn } from "@typeorm/core";
import { Role } from "./Role";

@Entity()
export class User {
    @PrimaryColumn() id: number;

    @PrimaryColumn() name: string;

    @Column() handedness: string;

    @ManyToMany(type => Role, {
        cascade: ["insert"]
    })
    @JoinTable()
    roles: Role[];
}
