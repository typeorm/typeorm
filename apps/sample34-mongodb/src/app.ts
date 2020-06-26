import "reflect-metadata";
import { Post } from "./app/entity/Post";
import { createMongoConnection, MongoConnectionOptions, MongoDriver } from '@typeorm/driver-mongodb';

const options: MongoConnectionOptions = {
  type: "mongodb",
  host: "localhost",
  database: "test",
  logging: ["query", "error"],
  // synchronize: true,
  entities: [Post],
  driver: MongoDriver
};

createMongoConnection(options).then(async connection => {

  const post = new Post();
  post.text = "Hello how are you?";
  post.title = "hello";
  post.likesCount = 100;

  const postRepository = connection.getRepository(Post);
  await postRepository.save(post);
  console.log("Post has been saved: ", post);

  const loadedPost = await postRepository.findOne({
    text: "Hello how are you?",
  });
  console.log("Post has been loaded: ", loadedPost);

  // take last 5 of saved posts
  const allPosts = await postRepository.find({take: 5});
  console.log("All posts: ", allPosts);

  // perform mongodb-specific query using cursor which returns properly initialized entities
  const cursor1 = connection.getRepository(Post).createEntityCursor({title: "hello"});
  console.log("Post retrieved via cursor #1: ", await cursor1.next());
  console.log("Post retrieved via cursor #2: ", await cursor1.next());

  // we can also perform mongodb-specific queries using mongodb-specific entity manager
  const cursor2 = connection.manager.createEntityCursor(Post, {title: "hello"});
  console.log("Only two posts retrieved via cursor: ", await cursor2.limit(2).toArray());

}, error => console.log("Error: ", error));
