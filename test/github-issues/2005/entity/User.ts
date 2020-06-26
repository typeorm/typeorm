import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: "tinyint",
        transformer: {
            from: val => !!val,
            to: val => val,
        },
    })
    activated: boolean;

}
