# Using with JavaScript
  
TypeORM can be used not only with TypeScript, but also with JavaScript. 
Everything is the same, except you need to omit types and if your platform does not support ES6 classes then you need to define objects with all required metadata.

##### app.js

```typescript
var typeorm = require("typeorm");

typeorm.createConnection({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "test",
    password: "admin",
    database: "test",
    synchronize: true,
    entitySchemas: [
        require("./entity/Post"),
        require("./entity/Category")
    ]
}).then(function (connection) {

    var category1 = {
        name: "TypeScript"
    };
    var category2 = {
        name: "Programming"
    };

    var post = {
        title: "Control flow based type analysis",
        text: "TypeScript 2.0 implements a control flow-based type analysis for local variables and parameters.",
        categories: [
            category1, category2
        ]
    };

    var postRepository = connection.getRepository("Post");
    postRepository.save(post)
        .then(function(savedPost) {
            console.log("Post has been saved: ", savedPost);
            console.log("Now lets load all posts: ");

            return postRepository.find();
        })
        .then(function(allPosts) {
            console.log("All posts: ", allPosts);
        });


}).catch(function(error) {
    console.log("Error: ", error);
});
```

##### entity/Category.js

```typescript
module.exports = {
    name: "Category",
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true
        },
        name: {
            type: "string"
        }
    }
};
```

##### entity/Post.js

```typescript
module.exports = {
    name: "Post",
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true
        },
        title: {
            type: "string"
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
};
```

You can checkout this example [typeorm/javascript-example](https://github.com/typeorm/javascript-example) to learn more.