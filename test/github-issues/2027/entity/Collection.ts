import {
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
} from "../../../../src/index";;

import { CollectionFile } from "./CollectionFile";

@Entity()
export class Collection {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @OneToMany(type => CollectionFile, collectionFile => collectionFile.collection)
    files!: CollectionFile[];
}
