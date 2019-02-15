import { Entity, PrimaryGeneratedColumn, ManyToOne } from "../../../../src";
import { Photo } from "./photo.entity";

@Entity()
export class PhotoElement {
    @PrimaryGeneratedColumn()
    public id: number;

    @ManyToOne(type => Photo)
    public photo: Photo;
}
