<div align="center">   <a href="http://typeorm.io/">     <img src="https://github.com/typeorm/typeorm/raw/master/resources/logo_big.png" width="492" height="228">   </a>   <br>   <br> 	<a href="https://app.circleci.com/pipelines/github/typeorm/typeorm"> 		<img src="https://circleci.com/gh/typeorm/typeorm/tree/master.svg?style=shield"> 	</a> 	<a href="https://badge.fury.io/js/typeorm"> 		<img src="https://badge.fury.io/js/typeorm.svg"> 	</a>     <a href="https://codecov.io/gh/typeorm/typeorm">         <img src="https://img.shields.io/codecov/c/github/typeorm/typeorm.svg" alt="Codecov">     </a> 	<a href="https://join.slack.com/t/typeorm/shared_invite/zt-uu12ljeb-OH_0086I379fUDApYJHNuw"> 		<img src="https://img.shields.io/badge/chat-on%20slack-blue.svg"> 	</a>   <br>   <br>
</div>

TypeORM은 NodeJS, Browser, Cordova, PhoneGap, Ionic, React Native, NativeScript, Expo 및 Electron 플랫폼에서 실행할 수 있는 [ORM](https://en.wikipedia.org/wiki/Object-relational_mapping)이며 TypeScript 및 JavaScript(ES5, ES6, ES7, ES8)와 함께 사용할 수 있다. TypeORM의 목표는 항상 최신 JavaScript 기능을 지원하고 몇 개의 테이블이 있는 작은 응용 프로그램에서 여러 데이터베이스가 있는 대규모 엔터프라이즈 응용 프로그램에 이르기까지 데이터베이스를 사용하는 모든 종류의 응용 프로그램을 개발하는 데 도움이 되는 추가 기능을 제공하는 것이다.

TypeORM은 현재 존재하는 다른 모든 JavaScript ORM과 달리 [Active Record](./docs/active-record-data-mapper.md#what-is-the-active-record-pattern) 및 [Data Mapper](./docs/active-record-data-mapper.md#what-is-the-data-mapper-pattern) 패턴을 모두 지원한다. 즉, 고품질의 느슨하게 결합된 확장 가능하고 유지 관리 가능한 애플리케이션을 가장 생산적인 방식으로 작성할 수 있다.

TypeORM은 [Hibernate](http://hibernate.org/orm/), [Doctrine](http://www.doctrine-project.org/) 및 [Entity Framework](https://www.asp.net/entity-framework)와 같은 다른 ORM의 영향을 많이 받는다.

## 특징

- [DataMapper](./docs/active-record-data-mapper.md#what-is-the-data-mapper-pattern)와 [ActiveRecord](./docs/active-record-data-mapper.md#what-is-the-active-record-pattern)을 모두 지원.
- 항목 및 열.
- 데이터베이스 별 열 유형.
- 엔터티 관리자.
- 레포지토리 및 사용자 지정 레포지토리.
- 명확한 객체 관계형 모델.
- 연관(관계).
- Eager&amp;lazy 관계.
- 단방향, 양방향 및 자체 참조 관계.
- 다중 상속 패턴을 지원.
- cascade.
- 색인.
- transaction.
- 마이그레이션 및 자동 마이그레이션 생성.
- 연결 풀링.
- 복제.
- 다중 데이터베이스 연결 사용.
- 여러 데이터베이스 유형 작업.
- 데이터베이스 간, 스키마 간의 쿼리.
- 우아한 문법과 유연하고 강력한 쿼리 빌더.
- left join과 inner join.
- join을 사용하는 쿼리에 대한 적절한 페이지네이션.
- 쿼리 캐싱.
- 원상태의 결과 스트리밍.
- 로깅.
- 리스너 및 구독자(hooks).
- 클로저 테이블 패턴 지원.
- 모델 또는 별도의 설정 파일에서 스키마 선언.
- MySQL / MariaDB / Postgres / CockroachDB / SQLite / Microsoft SQL Server / Oracle / SAP Hana / sql.js를 지원.
- MongoDB NoSQL 데이터베이스 지원.
- NodeJS / Browser / Ionic / Cordova / React Native / NativeScript / Expo / Electron 플랫폼에서 작동.
- TypeScript 및 JavaScript 지원.
- 생성된 코드는 우수한 성능과 유연함을 가지며, 클린하고 유지 관리가 용이.
- 가능한 모든 모범 예시를 따름.
- CLI.

게다가...

TypeORM을 사용하면 당신의 모델은 다음과 같이 보인다.

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    age: number;

}
```

당신의 도메인 로직은 다음과 같다:

```typescript
const repository = connection.getRepository(User);

const user = new User();
user.firstName = "Timber";
user.lastName = "Saw";
user.age = 25;
await repository.save(user);

const allUsers = await repository.find();
const firstUser = await repository.findOne(1); // find by id
const timber = await repository.findOne({ firstName: "Timber", lastName: "Saw" });

await repository.remove(timber);
```

또한 `ActiveRecord`구현을 사용하는걸 선호하는 경우, 당신은 다음과 같이 사용할 수도 있다.

```typescript
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from "typeorm";

@Entity()
export class User extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    age: number;

}
```

당신의 도메인 로직은 다음과 같다:

```typescript
const user = new User();
user.firstName = "Timber";
user.lastName = "Saw";
user.age = 25;
await user.save();

const allUsers = await User.find();
const firstUser = await User.findOne(1);
const timber = await User.findOne({ firstName: "Timber", lastName: "Saw" });

await timber.remove();
```

## 설치

1. npm 패키지를 설치한다:

    `npm install typeorm --save`

2. `reflect-metadata` 심(shim)을 설치한다:

    `npm install reflect-metadata --save`

    그리고 그것을 app (예: `app.ts`)의 전역 위치에 불러와야 한다:

    `import "reflect-metadata";`

3. 노드 타입을 설치해야 할 수도 있다:

    `npm install @types/node --save-dev`

4. DB 드라이버 설치를 설치한다:

    - **MySQL** 또는 **MariaDB**의 경우

        `npm install mysql --save` (you can install `mysql2` instead as well)

    - for **PostgreSQL**또는 **CockroachDB**의 경우

        `npm install pg --save`

    - **SQLite**의 경우

        `npm install sqlite3 --save`

    - **Microsoft SQL Server**의 경우

        `npm install mssql --save`

    - **sql.js**의 경우

        `npm install sql.js --save`

    - **Oracle**의 경우

        `npm install oracledb --save`

        Oracle 드라이버를 작동시키려면 [해당](https://github.com/oracle/node-oracledb) 사이트의 설치 지침을 따라야 한다.

    - **SAP Hana**의 경우

        ```
        npm i @sap/hana-client
        npm i hdb-pool
        ```

        *[Neptune Software](https://www.neptune-software.com/)의 후원으로 SAP Hana 지원이 가능해졌다.*

    - **MongoDB** (experimental)의 경우

        `npm install mongodb@^5.0.1--save`

    - **NativeScript**, **react-native**, **Cordova**의 경우

        [지원되는 플랫폼 문서](./docs/supported-platforms.md) 확인

    사용하는 데이터베이스에 따라*하나*만 설치

##### TypeScript 환경 설정

또한 TypeScript 버전 **3.3** 이상을 사용 중이어야 하고, `tsconfig.json`에서 다음 설정을 사용 가능하게 했는지 확인해야 한다:

```json
"emitDecoratorMetadata": true,
"experimentalDecorators": true,
```

컴파일러 옵션의 `lib` 섹션에서 `es6`을 사용 설정하거나, `@types`에서 `es6-shim`을 설치해야 할 수도 있다.

## 빠른 시작

TypeORM을 시작하는 가장 빠른 방법은 CLI 명령을 사용하여 시작 프로젝트를 생성하는 것이다. 빠른 시작은 NodeJS 애플리케이션에서 TypeORM을 사용하는 경우에만 동작한다. 다른 플랫폼을 사용하는 경우 [단계별 가이드](#step-by-step-guide)에 따라 진행해야 한다.

먼저, TypeORM을 전역 설치한다.:

```
npm install typeorm -g
```

그 다음 새 프로젝트를 만들고자 하는 디렉토리로 이동하여 명령을 실행한다:

```
typeorm init --name MyProject --database mysql
```

여기서 `name`은 프로젝트의 이름이고 `database`는 사용할 데이터베이스이다. 데이터베이스는 다음 중 하나일 수 있다: `mysql`, `mariadb`, `postgres`, `cockroachdb`, `sqlite`, `mssql`, `oracle`, `mongodb`, `cordova`, `react-native`, `expo`, `nativescript`.

이 명령은 `MyProject` 디렉토리에 다음의 파일들이 있는 새 프로젝트를 생성한다:

```
MyProject
├── src              // place of your TypeScript code
│   ├── entity       // place where your entities (database models) are stored
│   │   └── User.ts  // sample entity
│   ├── migration    // place where your migrations are stored
│   └── index.ts     // start point of your application
├── .gitignore       // standard gitignore file
├── ormconfig.json   // ORM and database connection configuration
├── package.json     // node module dependencies
├── README.md        // simple readme file
└── tsconfig.json    // TypeScript compiler options
```

> 기존 Node 프로젝트에서 `typeorm init`을 실행할 수도 있지만, 이미 가지고 있는 파일 중 일부를 무시할 수도 있기 때문에 주의해야한다.

다음 단계는 새 프로젝트 종속성을 설치하는 것이다:

```
cd MyProject
npm install
```

설치가 진행되는 동안 `ormconfig.json`파일을 편집하여 데이터베이스 연결 설정 옵션들을 입력한다:

```json
{
   "type": "mysql",
   "host": "localhost",
   "port": 3306,
   "username": "test",
   "password": "test",
   "database": "test",
   "synchronize": true,
   "logging": false,
   "entities": [
      "src/entity/**/*.ts"
   ],
   "migrations": [
      "src/migration/**/*.ts"
   ],
   "subscribers": [
      "src/subscriber/**/*.ts"
   ]
}
```

특히, 대부분의 경우 `host`, `username`, `password`, `database`및 `port` 옵션만 설정하면 된다.

설정을 마치고 모든 node 모듈이 설치되면 애플리케이션을 실행할 수 있다:

```
npm start
```

애플리케이션이 성공적으로 실행되고 새 사용자를 데이터베이스에 추가해야 한다. 이 프로젝트로 계속 작업하거나 필요한 다른 모듈을 통합하고 더 많은 엔터티 생성을 시작할 수 있다.

> `typeorm init --name MyProject --database mysql --express` 명령을 실행하여 Express가 설치된 고급 프로젝트를 생성할 수 있다.

>  `typeorm init --name MyProject --database postgres --docker` 명령을 실행하여 docker 작성 파일을 생성할 수 있다.

## 단계별 가이드

ORM에서 무엇을 기대하는가? 우선, 유지 관리가 어려운 SQL 쿼리를 많이 작성하지 않고도 데이터베이스 테이블을 생성하고 데이터를 검색 / 삽입 / 업데이트 / 삭제 할 것으로 기대한다. 이 가이드는 TypeORM을 처음부터 설정하고 ORM에서 기대하는 것을 수행하는 방법을 보여준다.

### 모델 생성

데이터베이스 작업은 테이블 생성에서 시작된다. TypeORM에게 데이터베이스 테이블을 생성하도록 지시하는 방법은 무엇인가? 답은 '모델을 통해서'이다. 앱의 모델은 데이터베이스 테이블입니다.

예를 들어, `Photo` 모델이 있다고 하자:

```typescript
export class Photo {
    id: number;
    name: string;
    description: string;
    filename: string;
    views: number;
    isPublished: boolean;
}
```

그리고 데이터베이스에 photo를 저장하려고 한다. 데이터베이스에 어떤 것을 저장하려면 먼저 데이터베이스 테이블이 필요하고 모델에서 데이터베이스 테이블이 생성된다. 모든 모델이 아니라 *entities*로 정의한 모델만 해당된다.

### 엔터티 생성

*Entity*는 `@Entity` 데코레이터로 장식(decorated)한 모델이다. 이러한 모델에 대한 데이터베이스 테이블이 생성된다. TypeORM을 사용하면 어디에서나 엔터티로 로드 / 삽입 / 업데이트 / 제거 또는 다른 작업을 수행할 수 있다.

`Photo` 모델을 엔터티로 만들어 보자.

```typescript
import { Entity } from "typeorm";

@Entity()
export class Photo {
    id: number;
    name: string;
    description: string;
    filename: string;
    views: number;
    isPublished: boolean;
}
```

이제  `Photo` 엔터티에 대한 데이터베이스 테이블이 생성되고 앱의 어디에서나 이 테이블로 작업할 수 있다. 우리는 데이터베이스 테이블을 만들었다. 그런데 어떤 테이블이 열(columns) 없이 존재할 수 있을까? 데이터베이스 테이블에 몇 개의 열을 생성해 보자.

### 테이블 열 추가

데이터베이스에 열을 추가하려면 `@Column` 데코레이터를 사용하여 열로 만들고자 하는 엔터티의 속성을 장식하기만 하면 된다.

```typescript
import { Entity, Column } from "typeorm";

@Entity()
export class Photo {

    @Column()
    id: number;

    @Column()
    name: string;

    @Column()
    description: string;

    @Column()
    filename: string;

    @Column()
    views: number;

    @Column()
    isPublished: boolean;
}
```

이제 `id`, `name`, `description`, `filename`, `views` 그리고 `isPublished` 열이 `photo` 테이블에 추가된다. 데이터베이스의 열 타입은 사용한 속성 유형에서 유추된다(예를 들어, `number`는 `integer`로, `string`은 `varchar`로, `boolean`은 `bool`로, 등). 그러나 `@Column` 데코레이터에 열 타입을 명시적으로 지정하여 데이터베이스가 지원하는 모든 열 타입을 사용할 수 있다.

열이 있는 데이터베이스 테이블을 생성했지만 한 가지가 남았다. 각 데이터베이스 테이블에는 기본 키가 있는 열이 있어야 한다.

### 기본 열 생성

각 엔터티에는 **무조건** 하나 이상 의 기본 키 열이 있어야 한다. 이것은 필수 요구 사항이다. 열을 기본 키로 만드려면 `@PrimaryColumn` 데코레이터를 사용해야 한다.

```typescript
import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity()
export class Photo {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    description: string;

    @Column()
    filename: string;

    @Column()
    views: number;

    @Column()
    isPublished: boolean;
}
```

### 자동 생성 열 만들기

이제 id 열이 자동 생성(이를 자동 증가 열, auto-increment generated identity column 이라고 함)되기를 원한다고 가정해보자. 그렇게 하려면 `@PrimaryColumn` 데코레이터를 `@PrimaryGeneratedColumn`로 변경해야 한다.

```typescript
import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Photo {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    description: string;

    @Column()
    filename: string;

    @Column()
    views: number;

    @Column()
    isPublished: boolean;
}
```

### 열 데이터 타입

다음으로 데이터 유형을 수정해보자. 기본적으로 문자열은 varchar(255)와 유사한 유형(데이터베이스 유형에 따라 다름)에 매핑되고, 숫자는 정수와 같은 유형으로 매핑된다(데이터베이스 유형에 따라 다름). 우리는 모든 열이 varchar 또는 정수로 제한되기를 원하지 않는다. 올바른 데이터 유형을 설정해보자:

```typescript
import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Photo {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        length: 100
    })
    name: string;

    @Column("text")
    description: string;

    @Column()
    filename: string;

    @Column("double")
    views: number;

    @Column()
    isPublished: boolean;
}
```

열 타입은 데이터베이스에 따라 다르다. 데이터베이스가 지원하는 모든 열 타입을 설정할 수 있다. 지원 되는 열 타입에 대한 자세한 정보는 [여기](./docs/entities.md#column-types)에서 찾을 수 있다.

### 데이터 베이스에 대한 연결 생성

이제 엔티티가 생성되면 `index.ts`(또는 `app.ts`처럼 원하는 것으로 부를 수 있음) 파일을 만들고 그곳에서 연결을 설정해 보자.

```typescript
import "reflect-metadata";
import { createConnection } from "typeorm";
import { Photo } from "./entity/Photo";

createConnection({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    entities: [
        Photo
    ],
    synchronize: true,
    logging: false
}).then(connection => {
    // here you can start to work with your entities
}).catch(error => console.log(error));
```

이 예시에서는 MySQL을 사용하고 있지만 지원되는 다른 데이터베이스를 사용할 수도 있다. 다른 데이터 베이스를 사용하려면 옵션의 `type`을 사용 중인 데이터베이스 타입으로 변경하기만 하면 된다(`mysql`, `mariadb`, `postgres`, `cockroachdb`, `sqlite`, `mssql`, `oracle`, `cordova`, `nativescript`, `react-native`, `expo`, or `mongodb`). 또한 호스트, 포트, 사용자 이름, 암호 및 데이터베이스 설정을 사용해야 한다.

이 연결에 대한 엔터티 목록에 Photo 엔터티를 추가했다. 연결에 사용 중인 각 엔터티가 여기에 나열되어야 한다.

`synchronize`를 설정하면 애플리케이션을 실행할 때마다 엔터티가 데이터베이스와 동기화된다.

### 디렉토리에서 모든 엔터티 불러오기

나중에 더 많은 엔터티를 만들 때 그것들을 설정에 추가해야 한다. 이것은 그다지 편리하지 않기 때문에 대신 모든 엔터티가 연결되고 연결에 사용될 전체 디렉토리를 설정할 수 있다:

```typescript
import { createConnection } from "typeorm";

createConnection({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    entities: [
        __dirname + "/entity/*.js"
    ],
    synchronize: true,
}).then(connection => {
    // here you can start to work with your entities
}).catch(error => console.log(error));
```

그러나 이러한 접근 방식에는 주의가 필요하다. `ts-node`를 사용하는 경우에는, `.ts` 파일에 대한 경로를 지정해야 하고`outDir`을 사용하는 경우에는, outDir 디렉토리 내의 `.js` 파일에 대한 경로를 지정해야 한다. `outDir`을 사용 중이고 엔터티를 제거하거나 이름을 변경할 때 `outDir` 디렉토리를 지우고 프로젝트를 다시 컴파일해야 한다. 왜냐하면 소스 `.ts` 파일을 제거할 때 컴파일된 `.js` 버전은 출력 디렉토리에서 제거되지 않고 여전히 `outDir` 디렉토리에 존재하여 TypeORM에 의해 로드되기 때문이다.

### 애플리케이션 실행

이제 `index.ts`를 실행하면 데이터베이스와의 연결이 초기화되고 photo에 대한 데이터베이스 테이블이 생성된다.

```shell
+-------------+--------------+----------------------------+
|                         photo                           |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| name        | varchar(100) |                            |
| description | text         |                            |
| filename    | varchar(255) |                            |
| views       | int(11)      |                            |
| isPublished | boolean      |                            |
+-------------+--------------+----------------------------+
```

### 데이터베이스에 photo 생성 및 삽입

이제 새 photo를 만들어 데이터베이스에 저장해 보자:

```typescript
import { createConnection } from "typeorm";
import { Photo } from "./entity/Photo";

createConnection(/*...*/).then(connection => {

    let photo = new Photo();
    photo.name = "Me and Bears";
    photo.description = "I am near polar bears";
    photo.filename = "photo-with-bears.jpg";
    photo.views = 1;
    photo.isPublished = true;

    return connection.manager
            .save(photo)
            .then(photo => {
                console.log("Photo has been saved. Photo id is", photo.id);
            });

}).catch(error => console.log(error));
```

엔터티가 저장되면 새로 생성된 ID를 갖게 된다. `save` 메소드는 전달한 것과 동일한 객체의 인스턴스를 반환한다. 이는 객체의 새 복사본이 아니며 "id"를 수정하고 반환한다.

### async/await 구문 사용

최신 ES8(ES2017) 기능을 활용하고 async/await 구문을 대신 사용해보자.

```typescript
import { createConnection } from "typeorm";
import { Photo } from "./entity/Photo";

createConnection(/*...*/).then(async connection => {

    let photo = new Photo();
    photo.name = "Me and Bears";
    photo.description = "I am near polar bears";
    photo.filename = "photo-with-bears.jpg";
    photo.views = 1;
    photo.isPublished = true;

    await connection.manager.save(photo);
    console.log("Photo has been saved");

}).catch(error => console.log(error));
```

### 엔터티 매니저 사용

방금 새 photo를 만들어 데이터베이스에 저장했었다. 이를 저장하기 위해 EntityManager를 사용하였다. 이처럼 엔터티 매니저를 사용하여 앱의 모든 엔터티를 조작할 수 있다. 예를 들어 저장된 엔터티를 로드해보자:

```typescript
import { createConnection } from "typeorm";
import { Photo } from "./entity/Photo";

createConnection(/*...*/).then(async connection => {

    /*...*/
    let savedPhotos = await connection.manager.find(Photo);
    console.log("All photos from the db: ", savedPhotos);

}).catch(error => console.log(error));
```

`savedPhotos`는 데이터베이스에서 로드된 데이터가 있는 Photo 객체의 배열이다.

[여기](./docs/working-with-entity-manager.md)에서 엔터티 매니저에 대해 자세히 알 수 있다.

### 리포지토리 사용

이제 코드를 리팩토링하여 `EntityManager` 대신 `Repository`를 사용해보자. 각 엔터티에는 엔터티에 대한 모든 작업을 처리하는 자체 리포지토리가 있다. 엔터티를 많이 다룰 때는 EntityManager보다 Repositories를 사용하는 것이 더 편리하다.

```typescript
import { createConnection } from "typeorm";
import { Photo } from "./entity/Photo";

createConnection(/*...*/).then(async connection => {

    let photo = new Photo();
    photo.name = "Me and Bears";
    photo.description = "I am near polar bears";
    photo.filename = "photo-with-bears.jpg";
    photo.views = 1;
    photo.isPublished = true;

    let photoRepository = connection.getRepository(Photo);

    await photoRepository.save(photo);
    console.log("Photo has been saved");

    let savedPhotos = await photoRepository.find();
    console.log("All photos from the db: ", savedPhotos);

}).catch(error => console.log(error));
```

[여기](./docs/working-with-repository.md)에서 리포지토리에 대해 자세히 알 수 있다.

### 데이터베이스에서 로드

리포지토리를 사용하여 더 많은 로드 작업을 시도해보자:

```typescript
import { createConnection } from "typeorm";
import { Photo } from "./entity/Photo";

createConnection(/*...*/).then(async connection => {

    /*...*/
    let allPhotos = await photoRepository.find();
    console.log("All photos from the db: ", allPhotos);

    let firstPhoto = await photoRepository.findOne(1);
    console.log("First photo from the db: ", firstPhoto);

    let meAndBearsPhoto = await photoRepository.findOne({ name: "Me and Bears" });
    console.log("Me and Bears photo from the db: ", meAndBearsPhoto);

    let allViewedPhotos = await photoRepository.find({ views: 1 });
    console.log("All viewed photos: ", allViewedPhotos);

    let allPublishedPhotos = await photoRepository.find({ isPublished: true });
    console.log("All published photos: ", allPublishedPhotos);

    let [allPhotos, photosCount] = await photoRepository.findAndCount();
    console.log("All photos: ", allPhotos);
    console.log("Photos count: ", photosCount);

}).catch(error => console.log(error));
```

### 데이터베이스에서 업데이트

이제 데이터베이스에서 단일 photo를 로드하고 업데이트하고 저장해보자:

```typescript
import { createConnection } from "typeorm";
import { Photo } from "./entity/Photo";

createConnection(/*...*/).then(async connection => {

    /*...*/
    let photoToUpdate = await photoRepository.findOne(1);
    photoToUpdate.name = "Me, my friends and polar bears";
    await photoRepository.save(photoToUpdate);

}).catch(error => console.log(error));
```

이제 `id = 1`인 photo가 데이터베이스에서 업데이트 될 것이다.

### 데이터베이스에서 제거

이제 데이터베이스에서 photo를 제거해보자:

```typescript
import { createConnection } from "typeorm";
import { Photo } from "./entity/Photo";

createConnection(/*...*/).then(async connection => {

    /*...*/
    let photoToRemove = await photoRepository.findOne(1);
    await photoRepository.remove(photoToRemove);

}).catch(error => console.log(error));
```

이제 `id = 1`인 photo가 데이터베이스에서 제거된다.

### 1:1 관계 생성

다른 클래스와 1:1 관계를 만들어 보자. `PhotoMetadata.ts`에 새 클래스를 생성해 보겠다. 이 PhotoMetadata 클래스에는 photo의 추가 메타 정보가 포함되어야 한다.

```typescript
import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from "typeorm";
import { Photo } from "./Photo";

@Entity()
export class PhotoMetadata {

    @PrimaryGeneratedColumn()
    id: number;

    @Column("int")
    height: number;

    @Column("int")
    width: number;

    @Column()
    orientation: string;

    @Column()
    compressed: boolean;

    @Column()
    comment: string;

    @OneToOne(type => Photo)
    @JoinColumn()
    photo: Photo;
}
```

여기에서는 `@OneToOne`이라는 새로운 데코레이터를 사용하고 있다. 이를 통해 두 엔터티 간에 1:1 관계를 만들 수 있다. `type => Photo`는 우리가 관계를 만들고자 하는 엔터티의 클래스를 반환하는 함수다. 언어적 특성 때문에 클래스를 직접 사용하는 대신 클래스를 반환하는 함수를 사용해야 한다. `() => Photo`로 쓸 수도 있지만 코드 가독성을 높이기 위해 `type => Photo`를 관습적으로 사용한다. 타입 변수 자체에는 아무 것도 포함되지 않는다.

또한 `@JoinColumn` 데코레이터를 추가하여 관계의 한 쪽이 관계를 소유하게 됨을 나타낸다. 관계는 단방향 또는 양방향일 수 있지만 관계의 한 쪽만 소유될 수 있다. `@JoinColumn` 데코레이터를 사용하는 것은 관계의 소유하는 쪽에서 필요로 한다.

앱을 실행하면 새로 생성된 테이블이 표시되며 여기에는 photo 관계에 대한 외래 키가 있는 열이 포함된다:

```shell
+-------------+--------------+----------------------------+
|                     photo_metadata                      |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| height      | int(11)      |                            |
| width       | int(11)      |                            |
| comment     | varchar(255) |                            |
| compressed  | boolean      |                            |
| orientation | varchar(255) |                            |
| photoId     | int(11)      | FOREIGN KEY                |
+-------------+--------------+----------------------------+
```

### 1:1 관계 저장

이제 photo와 해당 metadata를 저장하고 서로 첨부해보자.

```typescript
import { createConnection } from "typeorm";
import { Photo } from "./entity/Photo";
import { PhotoMetadata } from "./entity/PhotoMetadata";

createConnection(/*...*/).then(async connection => {

    // create a photo
    let photo = new Photo();
    photo.name = "Me and Bears";
    photo.description = "I am near polar bears";
    photo.filename = "photo-with-bears.jpg";
    photo.views = 1;
    photo.isPublished = true;

    // create a photo metadata
    let metadata = new PhotoMetadata();
    metadata.height = 640;
    metadata.width = 480;
    metadata.compressed = true;
    metadata.comment = "cybershoot";
    metadata.orientation = "portrait";
    metadata.photo = photo; // this way we connect them

    // get entity repositories
    let photoRepository = connection.getRepository(Photo);
    let metadataRepository = connection.getRepository(PhotoMetadata);

    // first we should save a photo
    await photoRepository.save(photo);

    // photo is saved. Now we need to save a photo metadata
    await metadataRepository.save(metadata);

    // done
    console.log("Metadata is saved, and the relation between metadata and photo is created in the database too");

}).catch(error => console.log(error));
```

### 관계의 반대측

관계는 단방향 또는 양방향일 수 있다. 현재 PhotoMetadata와 Photo 간의 관계는 단방향이다. 관계의 소유자는 PhotoMetadata이고 Photo는 PhotoMetadata에 대해 아무것도 모르는 상태다. 이로 인해 photo 측에서 PhotoMetadata에 액세스하는 것이 복잡해진다. 이 문제를 해결하려면 역 관계를 추가하여 PhotoMetadata와 Photo 간의 관계를 양방향으로 만들어야 한다. 엔터티를 수정해보자.

```typescript
import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from "typeorm";
import { Photo } from "./Photo";

@Entity()
export class PhotoMetadata {

    /* ... other columns */

    @OneToOne(type => Photo, photo => photo.metadata)
    @JoinColumn()
    photo: Photo;
}
```

```typescript
import { Entity, Column, PrimaryGeneratedColumn, OneToOne } from "typeorm";
import { PhotoMetadata } from "./PhotoMetadata";

@Entity()
export class Photo {

    /* ... other columns */

    @OneToOne(type => PhotoMetadata, photoMetadata => photoMetadata.photo)
    metadata: PhotoMetadata;
}
```

`photo => photo.metadata`는 관계의 반대측의 이름을 반환하는 함수다. 여기에서 Photo 클래스의 metadata 속성이 Photo 클래스에서 PhotoMetadata를 저장하는 위치임을 보여준다. photo의 속성을 반환하는 함수를 전달하는 대신 `"metadata"`와 같은 문자열을 `@OneToOne` 데코레이터에 전달할 수도 있다. 그러나 우리는 리팩토링을 더 쉽게 하기 위해 함수 타입 접근 방식을 사용했다.

`@JoinColumn` 데코레이터는 관계의 한 쪽에서만 사용해야한다. 이 데코레이터를 어느 쪽에 두든 그 쪽이 관계의 소유 측이 된다. 관계의 소유 측에는 데이터베이스에 외래 키가 있는 열이 있다.

### 관계와 함께 객체 로드

이제 단일 쿼리에서 photo와 phto metadata를 로드해보자. `find*` 메소드를 사용하거나 `QueryBuilder` 기능을 사용하는 두 가지 방법이 있다. 먼저 `find*` 메소드를 사용해보자. `find*` 메서드를 사용하면 `FindOneOptions` / `FindManyOptions` 인터페이스로 개체를 지정할 수 있게 된다.

```typescript
import { createConnection } from "typeorm";
import { Photo } from "./entity/Photo";
import { PhotoMetadata } from "./entity/PhotoMetadata";

createConnection(/*...*/).then(async connection => {

    /*...*/
    let photoRepository = connection.getRepository(Photo);
    let photos = await photoRepository.find({ relations: ["metadata"] });

}).catch(error => console.log(error));
```

여기에서 photos에는 데이터베이스의 photo 배열이 포함되고 각 photo에는 photo metadata가 포함된다. [이 문서](./docs/find-options.md)에서 찾기 옵션에 대해 자세히 알아볼 수 있다.

Using find options is good and dead 찾기 옵션을 사용하는 것은 훌륭하고 간단하지만 더 복잡한 쿼리가 필요한 경우에는 `QueryBuilder`를 대신 사용해야 한다. `QueryBuilder`를 사용하면 보다 복잡한 쿼리를 우아한 방식으로 사용할 수 있다.

```typescript
import { createConnection } from "typeorm";
import { Photo } from "./entity/Photo";
import { PhotoMetadata } from "./entity/PhotoMetadata";

createConnection(/*...*/).then(async connection => {

    /*...*/
    let photos = await connection
            .getRepository(Photo)
            .createQueryBuilder("photo")
            .innerJoinAndSelect("photo.metadata", "metadata")
            .getMany();


}).catch(error => console.log(error));
```

`QueryBuilder`를 사용하면 거의 모든 복잡한 SQL 쿼리를 만들고 실행할 수 있게 된다. `QueryBuilder`로 작업할 때 SQL 쿼리를 생성하는 것처럼 생각하자. 이 예에서 "photo" 및 "metadata"는 선택한 photo에 적용된 별칭이다. 별칭을 사용하여 선택한 데이터의 열 및 속성에 액세스한다.

### Casecade를 사용하여 관련 객체 자동 저장

다른 개체가 저장될 때마다 관련 개체가 저장되기를 원하는 경우 관계에서 cascade 옵션을 설정할 수 있다. photo의 `@OneToOne` 데코레이터를 약간 변경해 보자.

```typescript
export class Photo {
    /// ... other columns

    @OneToOne(type => PhotoMetadata, metadata => metadata.photo, {
        cascade: true,
    })
    metadata: PhotoMetadata;
}
```

`cascade`를 사용하면 photo를 따로 저장하지 않고도 metadata 객체를 따로 저장할 수 있게 된다. 이제 photo 객체를 간단히 저장할 수 있으며 metadata 객체는 cascade 옵션으로 인해 자동으로 저장된다.

```typescript
createConnection(options).then(async connection => {

    // create photo object
    let photo = new Photo();
    photo.name = "Me and Bears";
    photo.description = "I am near polar bears";
    photo.filename = "photo-with-bears.jpg";
    photo.isPublished = true;

    // create photo metadata object
    let metadata = new PhotoMetadata();
    metadata.height = 640;
    metadata.width = 480;
    metadata.compressed = true;
    metadata.comment = "cybershoot";
    metadata.orientation = "portrait";

    photo.metadata = metadata; // this way we connect them

    // get repository
    let photoRepository = connection.getRepository(Photo);

    // saving a photo also save the metadata
    await photoRepository.save(photo);

    console.log("Photo is saved, photo metadata is saved too.")

}).catch(error => console.log(error));
```

이제 이전과 같이 metadata의 `photo` 속성 대신 photo의 `metadata` 속성을 설정한다. `cascade` 기능은 photo를 photo 측면에서 metadata에 연결하는 경우에만 작동한다. metadata 측면을 설정하면 metadata가 자동으로 저장되지 않는다.

### N:1 또는 1:N 관계 생성

N:1/1:N 관계를 만들어 보자. photo에는 한 명의 author가 있고 각 author는 많은 photo를 가질 수 있다고 가정하고 우선 Author 클래스를 생성해 보자:

```typescript
import { Entity, Column, PrimaryGeneratedColumn, OneToMany, JoinColumn } from "typeorm";
import { Photo } from "./Photo";

@Entity()
export class Author {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Photo, photo => photo.author) // note: we will create author property in the Photo class below
    photos: Photo[];
}
```

`Author`는 관계의 반대 측면을 포함한다. `OneToMany`는 항상 관계의 반대 측면이며 관계의 다른 측면에 `ManyToOne` 없이는 존재할 수 없습니다.

이제 관계의 소유자 측을 Photo 엔터티에 추가해보자:

```typescript
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { PhotoMetadata } from "./PhotoMetadata";
import { Author } from "./Author";

@Entity()
export class Photo {

    /* ... other columns */

    @ManyToOne(type => Author, author => author.photos)
    author: Author;
}
```

N:1/1:N 관계에서 소유자측은 항상 다대일(ManyToOne)이다. 즉 `@ManyToOne`을 사용하는 클래스가 관련 객체의 id를 저장한다는 의미이다.

애플리케이션을 실행한 후, ORM은 `author` 테이블을 생성한다:

```shell
+-------------+--------------+----------------------------+
|                          author                         |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| name        | varchar(255) |                            |
+-------------+--------------+----------------------------+
```

또한 새 `author` 열을 추가하고 이에 대한 외래 키를 생성하여 `photo` 테이블을 수정한다:

```shell
+-------------+--------------+----------------------------+
|                         photo                           |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| name        | varchar(255) |                            |
| description | varchar(255) |                            |
| filename    | varchar(255) |                            |
| isPublished | boolean      |                            |
| authorId    | int(11)      | FOREIGN KEY                |
+-------------+--------------+----------------------------+
```

### M:N 관계 생성

M:N 관계를 만들어 보자. 사진이 여러 album에 포함될 수 있고 각 album들에 많은 photo들이 포함될 수 있다고 가정하여 `Album` 클래스를 만들어 보자:

```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from "typeorm";

@Entity()
export class Album {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToMany(type => Photo, photo => photo.albums)
    @JoinTable()
    photos: Photo[];
}
```

`@JoinTable`은 이것이 관계의 소유자 측임을 지정하는데 필요하다.

이제 `Photo` 클래스에 관계의 반대측을 추가해 보겠습니다:

```typescript
export class Photo {
    /// ... other columns

    @ManyToMany(type => Album, album => album.photos)
    albums: Album[];
}
```

애플리케이션을 실행한 후, ORM은 **album_photos_photo_albums**라는 *접합 테이블(junction table)*을 생성한다.:

```shell
+-------------+--------------+----------------------------+
|                album_photos_photo_albums                |
+-------------+--------------+----------------------------+
| album_id    | int(11)      | PRIMARY KEY FOREIGN KEY    |
| photo_id    | int(11)      | PRIMARY KEY FOREIGN KEY    |
+-------------+--------------+----------------------------+
```

ORM의 연결에서 `Album` 클래스를 등록하는 것을 잊으면 안된다:

```typescript
const options: ConnectionOptions = {
    // ... other options
    entities: [Photo, PhotoMetadata, Author, Album]
};
```

이제 데이터베이스에 album과 photo를 삽입해 보자:

```typescript
let connection = await createConnection(options);

// create a few albums
let album1 = new Album();
album1.name = "Bears";
await connection.manager.save(album1);

let album2 = new Album();
album2.name = "Me";
await connection.manager.save(album2);

// create a few photos
let photo = new Photo();
photo.name = "Me and Bears";
photo.description = "I am near polar bears";
photo.filename = "photo-with-bears.jpg";
photo.views = 1
photo.isPublished = true
photo.albums = [album1, album2];
await connection.manager.save(photo);

// now our photo is saved and albums are attached to it
// now lets load them:
const loadedPhoto = await connection
    .getRepository(Photo)
    .findOne(1, { relations: ["albums"] });
```

`loadedPhoto`는 다음과 같다:

```typescript
{
    id: 1,
    name: "Me and Bears",
    description: "I am near polar bears",
    filename: "photo-with-bears.jpg",
    albums: [{
        id: 1,
        name: "Bears"
    }, {
        id: 2,
        name: "Me"
    }]
}
```

### 쿼리 빌더 사용

쿼리 빌더를 사용하여 거의 모든 복잡한 SQL 쿼리를 작성할 수 있다. 예를 들어 다음과 같이 할 수 있다:

```typescript
let photos = await connection
    .getRepository(Photo)
    .createQueryBuilder("photo") // first argument is an alias. Alias is what you are selecting - photos. You must specify it.
    .innerJoinAndSelect("photo.metadata", "metadata")
    .leftJoinAndSelect("photo.albums", "album")
    .where("photo.isPublished = true")
    .andWhere("(photo.name = :photoName OR photo.name = :bearName)")
    .orderBy("photo.id", "DESC")
    .skip(5)
    .take(10)
    .setParameters({ photoName: "My", bearName: "Mishka" })
    .getMany();
```

이 쿼리는 이름이 "My" 또는 "Mishka"인 게시된 모든 photo를 선택한다. 위치 5(pagination 오프셋)에서 결과를 선택하고 10개 결과(pagination 제한)만 선택한다. 선택 결과는 id의 내림차순으로 정렬된다. photo의 album들은 결합된 상태로 유지되고 해당 metadata는 내부 결합(inner join)된다.

애플리케이션에서 쿼리 빌더를 많이 사용할 것이다. [여기](./docs/select-query-builder.md)에서 쿼리 빌더에 대해 자세히 알 수 있다.

## 샘플들

사용 예시는 [sample](https://github.com/typeorm/typeorm/tree/master/sample)의 샘플을 살펴보자.

clone하여 시작할 수 있는 몇 가지 리포지토리가 있다:

- [TypeScript와 함께 TypeORM을 사용하는 방법의 예시](https://github.com/typeorm/typescript-example)
- [JavaScript에서 TypeORM을 사용하는 방법의 예시](https://github.com/typeorm/javascript-example)
- [JavaScript 및 Babel과 함께 TypeORM을 사용하는 방법의 예시](https://github.com/typeorm/babel-example)
- [브라우저에서 TypeScript 및 SystemJS와 함께 TypeORM을 사용하는 방법의 예시](https://github.com/typeorm/browser-example)
- [브라우저에서 TypeScript 및 React와 함께 TypeORM을 사용하는 방법의 예시](https://github.com/ItayGarin/typeorm-react-swc)
- [Express 및 TypeORM 사용 방법의 예시](https://github.com/typeorm/typescript-express-example)
- [Koa 및 TypeORM 사용 예시](https://github.com/typeorm/typescript-koa-example)
- [MongoDB에서 TypeORM을 사용하는 방법의 예시](https://github.com/typeorm/mongo-typescript-example)
- [Cordova/PhoneGap 앱에서 TypeORM을 사용하는 방법의 예시](https://github.com/typeorm/cordova-example)
- [Ionic 앱에서 TypeORM을 사용하는 방법의 예시](https://github.com/typeorm/ionic-example)
- [React Native에서 TypeORM을 사용하는 방법의 예시](https://github.com/typeorm/react-native-example)
- [Nativescript-Vue와 함께 TypeORM을 사용하는 방법의 예시](https://github.com/typeorm/nativescript-vue-typeorm-sample)
- [Nativescript-Angular와 함께 TypeORM을 사용하는 방법의 예시](https://github.com/betov18x/nativescript-angular-typeorm-example)
- [JavaScript를 사용하여 Electron에서 TypeORM을 사용하는 방법의 예시](https://github.com/typeorm/electron-javascript-example)
- [TypeScript를 사용하여 Electron과 함께 TypeORM을 사용하는 방법의 예시](https://github.com/typeorm/electron-typescript-example)

## 확장

TypeORM 작업을 단순화하고 다른 모듈과 통합하는 몇 가지 확장 방법이 있다:

- [TypeORM + GraphQL 프레임워크](http://vesper-framework.com)
- [TypeORM](https://github.com/typeorm/typeorm-typedi-extensions)과 [TypeDI](https://github.com/pleerock/typedi) 통합
- [라우팅 컨트롤러](https://github.com/typeorm/typeorm-routing-controllers-extensions)와 [TypeORM 통합](https://github.com/pleerock/routing-controllers)
- 기존 데이터베이스에서 모델 생성 - [typeorm-model-generator](https://github.com/Kononnable/typeorm-model-generator)
- Fixtures loader - [typeorm-fixtures-cli](https://github.com/RobinCK/typeorm-fixtures)
- ER 다이어그램 생성기 - [typeorm-uml](https://github.com/eugene-manuilov/typeorm-uml/)
- 다른 ER 다이어그램 생성기 - [erdia](https://www.npmjs.com/package/erdia/)
- 데이터베이스 생성(create)/삭제(drop) - [typeorm-extension](https://github.com/Tada5hi/typeorm-extension)

## 기여

[여기](https://github.com/typeorm/typeorm/blob/master/CONTRIBUTING.md)에서 기여에 대해 알아보고 [여기](https://github.com/typeorm/typeorm/blob/master/DEVELOPER.md)에서 개발 환경을 설정하는 방법을 알 수 있다.

이 프로젝트는 모든 기여자 덕분에 존재한다:

<a href="https://github.com/typeorm/typeorm/graphs/contributors"></a>

## 스폰서

오픈 소스는 어려운데다가 많은 시간이 소요된다. TypeORM의 미래에 투자하고 싶다면 후원자가 되어 핵심 팀이 TypeORM의 개선 사항과 새로운 기능에 더 많은 시간을 할애할 수 있도록 도울 수 있다. 후원자가 되십시오.

<a href="https://opencollective.com/typeorm" target="_blank"></a>

## Gold 스폰서

Gold 스폰서가 되어 핵심 기여자로부터 프리미엄 기술 지원을 받을 수 있다. [Gold 스폰서 되기](https://opencollective.com/typeorm)

<a href="https://opencollective.com/typeorm" target="_blank"></a>
