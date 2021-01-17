import { Entity, Column, PrimaryGeneratedColumn } from "../../../../src";

@Entity("roles")
export class RoleEntity {
    @PrimaryGeneratedColumn()
    id?: number;
   
    @Column({
        type: "varchar",
        length: 255,
        name: "name",
    })
    name: string;

    @Column({
        type: "boolean",
        name: "is_admin",
    })
    isAdmin: boolean;

}
