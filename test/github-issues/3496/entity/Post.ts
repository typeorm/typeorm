import { Column, Entity, PrimaryGeneratedColumn, VersionColumn } from "@typeorm/core";

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number;

    @VersionColumn()
    version: number;

    @Column({type: "jsonb"})
    problems: object;
}
