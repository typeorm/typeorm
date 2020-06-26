import { Column, Entity, PrimaryColumn } from "@typeorm/core";

@Entity()
export class User {
    @PrimaryColumn({
        comment: "The ID of this user.",
        length: 16,
        type: "binary",
    })
    id: Buffer;

    @Column()
    name: string;
}
