import {Connection} from "../../../../../src";
import {ViewColumn} from "../../../../../src/decorator/columns/ViewColumn";
import {ViewEntity} from "../../../../../src/decorator/entity-view/ViewEntity";
import {Album} from "./Album";
import {Category} from "./Category";
import {Photo} from "./Photo";

@ViewEntity({
    expression: (connection: Connection) => connection.createQueryBuilder()
        .select("photo.id", "id")
        .addSelect("photo.name", "name")
        .addSelect("photo.albumId", "albumId")
        .addSelect("category.name", "categoryName")
        .addSelect("album.name", "albumName")
        .from(Photo, "photo")
        .leftJoin(Album, "album", "album.id = photo.albumId")
        .leftJoin(Category, "category", "category.id = album.categoryId")
        .where(`category.name = 'Cars'`)
})
export class PhotoAlbumCategory {

    @ViewColumn()
    id: number;

    @ViewColumn()
    name: string;

    @ViewColumn()
    categoryName: string;

    @ViewColumn()
    albumName: string;

    @ViewColumn({ name: "albumId" })
    photoAlbumId: number;
}
