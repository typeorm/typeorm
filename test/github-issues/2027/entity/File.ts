import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    OneToMany,
    BaseEntity,
} from "../../../../src/index";

import { CollectionFile } from "./CollectionFile";

@Entity()
export class File extends BaseEntity {
    @PrimaryGeneratedColumn("uuid") id!: string;

    @Column({type: "text", default: ""})
    name: string;

    @OneToMany(type => CollectionFile, collectionFile => collectionFile.file)
    collections: CollectionFile[];
}
