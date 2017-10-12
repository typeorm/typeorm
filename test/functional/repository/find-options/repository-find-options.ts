import "reflect-metadata";
import {expect} from "chai";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {User} from "./entity/User";
import {Category} from "./entity/Category";
import {Post} from "./entity/Post";
import {Photo} from "./entity/Photo";

describe("repository > find options", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should load relations", () => Promise.all(connections.map(async connection => {

        const user = new User();
        user.name = "Alex Messer";
        await connection.manager.save(user);

        const category = new Category();
        category.name = "Boys";
        await connection.manager.save(category);

        const post = new Post();
        post.title = "About Alex Messer";
        post.author = user;
        post.categories = [category];
        await connection.manager.save(post);

        const loadedPost = await connection.getRepository(Post).findOne({
            relations: ["author", "categories"]
        });
        expect(loadedPost).to.be.eql({
            id: 1,
            title: "About Alex Messer",
            author: {
                id: 1,
                name: "Alex Messer"
            },
            categories: [{
                id: 1,
                name: "Boys"
            }]
        });

    })));

    it("should select specific columns", () => Promise.all(connections.map(async connection => {

        const category = new Category();
        category.name = "Bears";
        await connection.manager.save(category);

        const categories = [category];
        const photos = [];
        for (let i = 1; i < 10; i++) {
            const photo = new Photo();
            photo.name = `Me and Bears ${i}`;
            photo.description = `I am near bears ${i}`;
            photo.filename = `photo-with-bears-${i}.jpg`;
            photo.views = 10;
            photo.isPublished = false;
            photo.categories = categories;
            photos.push(photo);
            await connection.manager.save(photo);
        }

        const loadedPhoto = await connection.getRepository(Photo).findOne({
            select: ["name"],
            where: {
                id: 5
            }
        });

        const loadedPhotos1 = await connection.getRepository(Photo).find({
            select: ["filename", "views"],
        });

        const loadedPhotos2 = await connection.getRepository(Photo).find({
            select: ["id", "name", "description"],
            relations: ["categories"],
        });

        // const loadedPhotos3 = await connection.getRepository(Photo).createQueryBuilder("photo")
        //     .select(["photo.name", "photo.description"])
        //     .addSelect(["category.name"])
        //     .leftJoin("photo.categories", "category")
        //     .getMany();

        expect(loadedPhoto).to.be.eql({
            name: "Me and Bears 5"
        });

        expect(loadedPhotos1).to.have.deep.members(photos.map(photo => ({
            filename: photo.filename,
            views: photo.views,
        })));

        expect(loadedPhotos2).to.have.deep.members(photos.map(photo => ({
            id: photo.id,
            name: photo.name,
            description: photo.description,
            categories,
        })));

        // expect(loadedPhotos3).to.have.deep.members(photos.map(photo => ({
        //     name: photo.name,
        //     description: photo.description,
        //     categories: categories.map(category => ({
        //         name: category.name,
        //     })),
        // })));
    })));

    it("should order by columns", () => Promise.all(connections.map(async (connection) => {
        const repository = connection.getRepository(Category);

        const animals = ["Dogs", "Cats", "Dogs", "Eagles"];
        for (let animal of animals) {
            const category = repository.create({name: animal});
            await repository.save(category);
        }

        const arrayOrderResult = await repository.find({order: [["name", "ASC"], ["id", "DESC"]]});
        const objectOrderResult = await repository.find({order: {"name": "ASC", "id": "DESC"}});

        const indexOfCats = arrayOrderResult.findIndex(o => o.name === "Cats");
        const indexOfDogs = arrayOrderResult.findIndex(o => o.name === "Dogs");
        const secondFieldOrder = arrayOrderResult.filter(o => o.name === "Dogs");

        expect(arrayOrderResult).to.be.an("array");
        expect(objectOrderResult).to.be.an("array");

        expect(arrayOrderResult).eql(objectOrderResult, "result should be the same");

        expect(indexOfCats).is.lessThan(indexOfDogs, "Cats should before Dogs");

        expect(secondFieldOrder[0].id).is.greaterThan(secondFieldOrder[1].id, "id should have ordered");
    })));

});