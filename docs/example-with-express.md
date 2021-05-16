# Example using TypeORM with Express

* [Initial setup](#initial-setup)
* [Adding Express to the application](#adding-express-to-the-application)
* [Adding TypeORM to the application](#adding-typeorm-to-the-application)

## Initial setup

Let's create a simple application called "user" which stores users in the database
and allows us to create, update, remove, and get a list of all users, as well as a single user by id
within web api.

First, create a directory called "user":

```
mkdir user
```

Then switch to the directory and create a new project:

```
cd user
npm init
```

Finish the init process by filling in all required application information.

Now we need to install and setup a TypeScript compiler. Lets install it first:

```
npm i typescript --save-dev
```

Then let's create a `tsconfig.json` file which contains the configuration required for the application to
compile and run. Create it using your favorite editor and put the following configuration:

```json
{
  "compilerOptions": {
    "lib": ["es5", "es6", "dom"],
    "target": "es5",
    "module": "commonjs",
    "moduleResolution": "node",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true
  }
}
```

Now let's create a main application endpoint - `app.ts` inside the `src` directory:

```
mkdir src
cd src
touch app.ts
```

Let's add a simple `console.log` inside it:

```typescript
console.log("Application is up and running");
```

Now it's time to run our application.
To run it, you need to compile your typescript project first:

```
tsc
```

Once you compile it, you should have a `src/app.js` file generated.
You can run it using:

```
node src/app.js
```

You should see the, "Application is up and running" message in your console right after you run the application.

You must compile your files each time you make a change.
Alternatively, you can setup watcher or install [ts-node](https://github.com/TypeStrong/ts-node) to avoid manual compilation each time.

## Adding Express to the application

Let's add Express to our application. First, let's install the packages we need:

```
npm i express  @types/express --save
```

* `express` is the express engine itself. It allows us to create a web api
* `@types/express` is used to have a type information when using express

Let's edit the `src/app.ts` file and add express-related logic:

```typescript
import * as express from "express";
import {Request, Response} from "express";

// create and setup express app
const app = express();
app.use(express.json());

// register routes

app.get("/users", function(req: Request, res: Response) {
    // here we will have logic to return all users
});

app.get("/users/:id", function(req: Request, res: Response) {
    // here we will have logic to return user by id
});

app.post("/users", function(req: Request, res: Response) {
    // here we will have logic to save a user
});

app.put("/users/:id", function(req: Request, res: Response) {
    // here we will have logic to update a user by a given user id
});

app.delete("/users/:id", function(req: Request, res: Response) {
    // here we will have logic to delete a user by a given user id
});

// start express server
app.listen(3000);
```

Now you can compile and run your project.
You should have an express server running now with working routes.
However, those routes do not return any content yet.

## Adding TypeORM to the application

Finally, let's add TypeORM to the application.
In this example, we will use `mysql` driver.
Setup process for other drivers is similar.

Let's install the required packages first:

```
npm i typeorm mysql reflect-metadata --save
```

* `typeorm` is the typeorm package itself
* `mysql` is the underlying database driver.
If you are using a different database system, you must install the appropriate package
* `reflect-metadata` is required to make decorators to work properly

Now let's create `ormconfig.json` with the database connection configuration we will use.

```json
  {
    "type": "mysql",
    "host": "localhost",
    "port": 3306,
    "username": "test",
    "password": "test",
    "database": "test",
    "entities": ["src/entity/*.js"],
    "logging": true,
    "synchronize": true
  }
```

Configure each option as you need.
Learn more about [connection options](./connection-options.md).

Let's create a `User` entity inside `src/entity`:

```typescript
import {Entity, Column, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

}
```

Let's change `src/app.ts`:

```typescript
import * as express from "express";
import {Request, Response} from "express";
import {createConnection} from "typeorm";
import {User} from "./entity/User";

// create typeorm connection
createConnection().then(connection => {
    const userRepository = connection.getRepository(User);

    // create and setup express app
    const app = express();
    app.use(express.json());

    // register routes

    app.get("/users", async function(req: Request, res: Response) {
        const users = await userRepository.find();
        res.json(users);
    });

    app.get("/users/:id", async function(req: Request, res: Response) {
        const results = await userRepository.findOne(req.params.id);
        return res.send(results);
    });

    app.post("/users", async function(req: Request, res: Response) {
        const user = await userRepository.create(req.body);
        const results = await userRepository.save(user);
        return res.send(results);
    });

    app.put("/users/:id", async function(req: Request, res: Response) {
        const user = await userRepository.findOne(req.params.id);
        userRepository.merge(user, req.body);
        const results = await userRepository.save(user);
        return res.send(results);
    });

    app.delete("/users/:id", async function(req: Request, res: Response) {
        const results = await userRepository.delete(req.params.id);
        return res.send(results);
    });

    // start express server
    app.listen(3000);
});
```

If you want to extract action callbacks into separate files and you need the `connection` instance,
you can simply use `getConnection`:

```typescript
import {getConnection} from "typeorm";
import {User} from "./entity/User";

export function UsersListAction(req: Request, res: Response) {
    return getConnection().getRepository(User).find();
}
```

You don't even need `getConnection` in this example - you can directly use the `getRepository` function:

```typescript
import {getRepository} from "typeorm";
import {User} from "./entity/User";

export function UsersListAction(req: Request, res: Response) {
    return getRepository(User).find();
}
```
