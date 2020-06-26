import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";
import { Role } from "../set";

@Entity("post")
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column("set", {
        default: [Role.Admin, Role.Developer],
        enum: Role
    })
    roles: Role[];
}
