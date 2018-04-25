import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "../../../../src/index";

import { Collection } from "./Collection";
import { File } from "./File";

@Entity("collection_file")
export class CollectionFile {

    @ManyToOne(type => File, file => file.collections)
    @PrimaryColumn({type: "uuid", name: "file_id"})
    @JoinColumn({name: "file_id"})
    file!: File;

    @ManyToOne(type => Collection, collection => collection.files)
    @PrimaryColumn({type: "uuid", name: "collection_id"})
    @JoinColumn({name: "collection_id"})
    collection!: Collection;

    @Column({type: "bigint"})
    sort: number;
}
