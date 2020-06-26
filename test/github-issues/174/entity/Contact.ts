import { Column } from "@typeorm/core";

export class Contact {

    @Column()
    name: string;

    @Column()
    email: string;

}
