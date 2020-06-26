import { ConnectionOptions, createConnection } from '@typeorm/core';
import { MysqlDriver } from '@typeorm/driver-mysql';
import { Post } from './entity/Post';

const options: ConnectionOptions = {
  name: "mysql",
  type: "mysql",
  host: "localhost",
  port: 3306,
  username: "test",
  password: "test",
  database: "test",
  logging: true,
  synchronize: true,
  entities: [Post],
  driver: MysqlDriver
};

createConnection(options).then(async connection => {

  const post = new Post();
  post.text = "Hello how are you?";
  post.title = "hello";
  post.likesCount = 100;

  const postRepository = connection.getRepository(Post);

  postRepository
    .save(post)
    .then(post => console.log("Post has been saved: ", post))
    .catch(error => console.log("Cannot save. Error: ", error));

}, error => console.log("Cannot connect: ", error));
