import { Column, Entity, PrimaryColumn } from "@typeorm/core";

@Entity()
export class Dummy2 {
    @PrimaryColumn("integer", {
        generated: true,
        nullable: false,
        primary: true,
    })
    id: number;

    @Column({default: "name"})
    name: string;
}

