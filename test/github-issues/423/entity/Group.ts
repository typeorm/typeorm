import { Column, Entity, Index, PrimaryColumn } from "@typeorm/core";

@Index("Groups name", ["name"], {unique: true})
@Entity("groups")
export class Group {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

}
