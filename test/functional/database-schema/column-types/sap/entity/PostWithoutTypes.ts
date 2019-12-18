import {Column, PrimaryColumn} from "../../../../../../src";

export class PostWithoutTypes {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    boolean: boolean;

    @Column()
    blob: Buffer;

    @Column()
    datetime: Date;

}
