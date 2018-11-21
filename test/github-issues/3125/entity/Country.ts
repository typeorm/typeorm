import {CreateDateColumn, Entity, PrimaryColumn, Column} from "../../../../src";

@Entity()
export class Country {

    @PrimaryColumn()
    code: string;

    @Column()
    name: string;

    @CreateDateColumn()
    createdAt: Date;

}
