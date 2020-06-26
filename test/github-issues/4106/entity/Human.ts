import { Column, Entity, PrimaryColumn } from "@typeorm/core";

import { Gender } from "./GenderEnum";

@Entity()
export class Human {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @Column({
        type: "enum",
        enum: Gender,
        enumName: "genderEnum",
        name: "Gender"
    })
    gender: Gender;

}
