import "reflect-metadata"
import { DataSource, DataSourceOptions } from "../../src/index"
import { Post } from "./entity/Post"
import { PostDetails } from "./entity/PostDetails"
import { Image } from "./entity/Image"
import { Cover } from "./entity/Cover"
import { Category } from "./entity/Category"

const options: DataSourceOptions = {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    synchronize: true,
    entities: [__dirname + "/entity/*"],
}

const dataSource = new DataSource(options)
dataSource
    .initialize()
    .then((dataSource) => {
        const postRepository = dataSource.getRepository(Post)

        const postCover = new Cover()
        postCover.url = "http://covers.com/post.jpg"

        const details = new PostDetails()
        details.meta = "hello"
        details.comment = "wow"

        const category1 = new Category()
        category1.description = "about post1"

        const category2 = new Category()
        category2.description = "about post2"

        const image = new Image()
        image.name = "post.jpg"

        const post = new Post()
        post.title = "Hello post"
        post.text = "Hello world of post#1"
        post.cover = postCover
        post.details = details
        post.images.push(image)
        post.categories = [category1, category2]

        postRepository
            .save(post)
            .then((result) => {
                /*const qb = postRepository.createQueryBuilder("post")
            .leftJoinAndSelect("post.details", "details")
            .leftJoinAndSelect("post.images", "images")
           // .leftJoinAndSelect("post.coverId", "coverId")
            .leftJoinAndSelect("post.categories", "categories")
            .where("post.id=:id")
            .setParameter("id", 6);

        return qb
            .getSingleResult()
            .then(post => {
                console.log("loaded post: ", post);

                let category1 = new Category();
                category1.id = 12;
                category1.description = "about cat#12";

                let category2 = new Category();
                category2.id = 52;
                category2.description = "about cat#52";

                let image = new Image();
                image.name = "second image of the post";

                //post
                post.title = "This! is updated post$";
                post.text = "Hello world of post#4";
                post.categories = [category2, category1];
                post.images.push(image);
                return postRepository.save(post);

            })
            .then(() => qb.getSingleResult())
            .then(reloadedPost => console.log("reloadedPost: ", reloadedPost));*/
            })
            .then((result) => console.log(result))
            .catch((error) => console.log(error.stack ? error.stack : error))

        return

        /*const postJson = {
        id: 1,  // changed
        text: "This is post about hello", // changed
        title: "hello", // changed
        details: { // new relation added
            id: 10, // new object persisted
            comment: "This is post about hello",
            meta: "about-hello!",
            chapter: {
                id: 1, // new object persisted
                about: "part I"
            },
            categories: [{
                id: 5, // new object persisted
                description: "cat5"
            }]
        },
        cover: null, // relation removed
        images: [{  // new relation added
            id: 4, // new object persisted
            name: "post!.jpg",
            secondaryPost: {
                id: 2,
                title: "secondary post"
            }
        }, { // secondaryPost relation removed
            id: 3,
            name: "post_2!.jpg", // changed
            details: { // new relation added
                id: 3, // new object persisted
                meta: "sec image",
                comment: "image sec"
            }
        }],
        categories: [{ // two categories removed, new category added
            id: 4, // new persisted
            description: "cat2"
        }]
    };

    let entity = postRepository.create(postJson);
    return postRepository.initialize(postJson)
        .then(result => {
            const mergedEntity = postRepository.merge(result, entity);
            console.log("entity created from json: ", entity);
            console.log("entity initialized from db: ", result);
            console.log("entity merged: ", mergedEntity);
            const diff = postRepository.difference(result, mergedEntity);
            console.log("diff: ", diff);
           //console.log("diff[0]: ", diff[0].removedRelations);
        })
        .catch(error => console.log(error.stack ? error.stack : error));

    let qb = postRepository
        .createQueryBuilder("post")
        .addSelect("cover")
        .addSelect("image")
        .addSelect("imageDetails")
        .addSelect("secondaryImage")
        .addSelect("category")
        .innerJoin("post.coverId", "cover")
        .leftJoin("post.images", "image")
        .leftJoin("post.secondaryImages", "secondaryImage")
        .leftJoin("image.details", "imageDetails", "on", "imageDetails.meta=:meta")
        .leftJoin("post.categories", "category", "on", "category.description=:description")
        //.leftJoin(Image, "image", "on", "image.post=post.id")
        //.where("post.id=:id")
        .setParameter("id", 1)
        .setParameter("description", "cat2")
        .setParameter("meta", "sec image");

    return qb
        .getSingleResult()
        .then(post => console.log(post))
        // .then(result => console.log(JSON.stringify(result, null, 4)))
        .catch(error => console.log(error.stack ? error.stack : error));*/

        /*let details = new PostDetails();
    details.comment = "This is post about hello";
    details.meta = "about-hello";

    const post = new Post();
    post.text = "Hello how are you?";
    post.title = "hello";
    //post.details = details;

    postRepository
        .save(post)
        .then(post => console.log("Post has been saved"))
        .catch(error => console.log("Cannot save. Error: ", error));*/
    })
    .catch((error) => console.log(error.stack ? error.stack : error))
