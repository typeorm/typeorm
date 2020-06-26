import { Column, Entity, Index, PrimaryColumn, Unique } from "@typeorm/core";

@Entity()
@Unique(["name"])
@Index(["text"], {unique: true})
export class Photo {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    @Index({unique: true})
    tag: string;

    @Column({unique: true})
    description: string;

    @Column()
    text: string;

}
