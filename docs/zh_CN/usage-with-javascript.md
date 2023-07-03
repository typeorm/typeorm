# 使用 JavaScript

TypeORM 不仅可以用于 TypeScript，还可以用于 JavaScript。
一切都是一样的，除了需要省略类型，如果你的平台不支持 ES6 类，那么你需要定义具有所有必需元数据的对象。

##### app.js

```typescript
var typeorm = require("typeorm");

typeorm
  .createConnection({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "test",
    password: "admin",
    database: "test",
    synchronize: true,
    entities: [
        require("./entity/Post"), 
        require("./entity/Category")
    ]
  })
  .then(function(connection) {
    var category1 = {
      name: "TypeScript"
    };
    var category2 = {
      name: "Programming"
    };

    var post = {
      title: "Control flow based type analysis",
      text: "TypeScript 2.0 implements a control flow-based type analysis for local variables and parameters.",
      categories: [category1, category2]
    };

    var postRepository = connection.getRepository("Post");
    postRepository
      .save(post)
      .then(function(savedPost) {
        console.log("Post has been saved: ", savedPost);
        console.log("Now lets load all posts: ");

        return postRepository.find();
      })
      .then(function(allPosts) {
        console.log("All posts: ", allPosts);
      });
  })
  .catch(function(error) {
    console.log("Error: ", error);
  });
```

##### entity/Category.js

```typescript
var EntitySchema = require("typeorm").EntitySchema;

module.exports = new EntitySchema({
  name: "Category",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true
    },
    name: {
      type: "varchar"
    }
  }
});
```

##### entity/Post.js

```typescript
var EntitySchema = require("typeorm").EntitySchema;

module.exports = new EntitySchema({
  name: "Post",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true
    },
    title: {
      type: "varchar"
    },
    text: {
      type: "text"
    }
  },
  relations: {
    categories: {
      target: "Category",
      type: "many-to-many",
      joinTable: true,
      cascade: true
    }
  }
});
```

您可以查看此示例[typeorm/javascript-example](https://github.com/typeorm/javascript-example)以了解更多信息。
