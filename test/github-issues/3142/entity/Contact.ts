import { Column } from "@typeorm/core";

export class Contact {

    @Column({unique: true})
    email: string;
}
