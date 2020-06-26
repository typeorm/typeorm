import { Column, Entity, PrimaryColumn } from "@typeorm/core";

@Entity()
export class User {
    @PrimaryColumn()
    email: string;

    @PrimaryColumn()
    username: string;

    @Column()
    bio: string;
}
