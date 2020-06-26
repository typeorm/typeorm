import { Column, Entity } from "@typeorm/core";

@Entity()
export class Dummy {
    @Column("integer", {
        generated: true,
        nullable: false,
        primary: true,
    })
    id: number;

    @Column({default: "name"})
    name: string;
}

