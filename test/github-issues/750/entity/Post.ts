import { Column, Entity, Index, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
@Index(["name"], {fulltext: true})
@Index(["point"], {spatial: true})
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column("point")
    point: string;

    @Column("polygon")
    polygon: string;

}
