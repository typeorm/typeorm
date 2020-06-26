import { Column, DeleteDateColumn, Entity, JoinTable, ManyToMany, OneToMany, PrimaryColumn } from "@typeorm/core";
import { Photo } from "./Photo";

@Entity()
export class User { // todo: check one-to-one relation as well, but in another model or test

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @DeleteDateColumn()
    deletedAt: Date;

    @OneToMany(type => Photo, photo => photo.user, {cascade: true})
    manyPhotos: Photo[];

    @ManyToMany(type => Photo, {cascade: true})
    @JoinTable()
    manyToManyPhotos: Photo[];

}
