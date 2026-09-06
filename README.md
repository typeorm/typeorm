<div align="center">
  <a href="http://typeorm.io/">
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://github.com/typeorm/typeorm/raw/master/resources/typeorm-logo-colored-light.png">
        <source  media="(prefers-color-scheme: light)" srcset="https://github.com/typeorm/typeorm/raw/master/resources/typeorm-logo-colored-dark.png">
        <img height="80" width="auto" alt="TypeORM Logo" src="https://github.com/typeorm/typeorm/raw/master/resources/typeorm-logo-colored-dark.png">
    </picture>
  </a>
  <br>
  <br>
    <a href="https://www.npmjs.com/package/typeorm"><img src="https://img.shields.io/npm/v/typeorm" alt="NPM Version"/></a>
    <a href="https://www.npmjs.com/package/typeorm"><img src="https://img.shields.io/npm/dm/typeorm" alt="NPM Downloads"/></a>
    <a href="https://sonarcloud.io/summary/overall?id=typeorm_typeorm"><img src="https://sonarcloud.io/api/project_badges/measure?project=typeorm_typeorm&metric=coverage" alt="Coverage"/></a>
    <a href=""><img src="https://img.shields.io/badge/License-MIT-teal.svg" alt="MIT License"/></a>
  <br>
  <br>
</div>

TypeORM is an [ORM](https://en.wikipedia.org/wiki/Object-relational_mapping) that can run in Node.js, Browser, Cordova, Ionic, React Native, NativeScript, Expo, and Electron platforms and can be used with TypeScript and JavaScript (ES2023). Its goal is to always support the latest JavaScript features and provide additional features that help you to develop any kind of application that uses databases - from small applications with a few tables to large-scale enterprise applications with multiple databases.

TypeORM supports more databases than any other JS/TS ORM: [Google Spanner](./docs/docs/drivers/google-spanner.md), [Microsoft SqlServer](./docs/docs/drivers/microsoft-sqlserver.md), [MySQL/MariaDB](./docs/docs/drivers/mysql.md), [MongoDB](./docs/docs/drivers/mongodb.md), [Oracle](./docs/docs/drivers/oracle.md), [Postgres](./docs/docs/drivers/postgres.md), [SAP HANA](./docs/docs/drivers/sap.md) and [SQLite](./docs/docs/drivers/sqlite.md), as well as derived databases and different drivers.

TypeORM supports both [Active Record](./docs/docs/guides/1-active-record-data-mapper.md#what-is-the-active-record-pattern) and [Data Mapper](./docs/docs/guides/1-active-record-data-mapper.md#what-is-the-data-mapper-pattern) patterns, unlike all other JavaScript ORMs currently in existence, which means you can write high-quality, loosely coupled, scalable, maintainable applications in the most productive way.

TypeORM is highly influenced by other ORMs, such as [Hibernate](http://hibernate.org/orm/),
[Doctrine](http://www.doctrine-project.org/) and [Entity Framework](https://www.asp.net/entity-framework).

## Features

- Supports both [DataMapper](./docs/docs/guides/1-active-record-data-mapper.md#what-is-the-data-mapper-pattern) and [ActiveRecord](./docs/docs/guides/1-active-record-data-mapper.md#what-is-the-active-record-pattern) (your choice).
- Entities and columns.
- Database-specific column types.
- Entity manager.
- Repositories and custom repositories.
- Clean object-relational model.
- Associations (relations).
- Eager and lazy relations.
- Unidirectional, bidirectional, and self-referenced relations.
- Supports multiple inheritance patterns.
- Cascades.
- Indices.
- Transactions.
- Migrations and automatic migrations generation.
- Connection pooling.
- Replication.
- Using multiple database instances.
- Working with multiple database types.
- Cross-database and cross-schema queries.
- Elegant-syntax, flexible and powerful QueryBuilder.
- Left and inner joins.
- Proper pagination for queries using joins.
- Query caching.
- Streaming raw results.
- Logging.
- Listeners and subscribers (hooks).
- Supports closure table pattern.
- Schema declaration in models or separate configuration files.
- Supports MySQL / MariaDB / Postgres / CockroachDB / SQLite / Microsoft SQL Server / Oracle / SAP Hana / sql.js.
- Supports MongoDB NoSQL database.
- Works in Node.js / Browser / Ionic / Cordova / React Native / NativeScript / Expo / Electron platforms.
- TypeScript and JavaScript support.
- ESM and CommonJS support.
- Produced code is performant, flexible, clean, and maintainable.
- Follows all possible best practices.
- CLI.

And more...

With TypeORM, your models look like this:

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column()
    age: number
}
```

And your domain logic looks like this:

```typescript
const userRepository = MyDataSource.getRepository(User)

const user = new User()
user.firstName = "Timber"
user.lastName = "Saw"
user.age = 25
await userRepository.save(user)

const allUsers = await userRepository.find()
const firstUser = await userRepository.findOneBy({
    id: 1,
}) // find by id
const timber = await userRepository.findOneBy({
    firstName: "Timber",
    lastName: "Saw",
}) // find by firstName and lastName

await userRepository.remove(timber)
```

Alternatively, if you prefer to use the `ActiveRecord` implementation, you can use it as well:

```typescript
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from "typeorm"

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column()
    age: number
}
```

And your domain logic will look this way:

```typescript
const user = new User()
user.firstName = "Timber"
user.lastName = "Saw"
user.age = 25
await user.save()

const allUsers = await User.find()
const firstUser = await User.findOneBy({
    id: 1,
})
const timber = await User.findOneBy({
    firstName: "Timber",
    lastName: "Saw",
})

await timber.remove()
```

## Samples

There are a few repositories that you can clone and start with:

- [Example how to use TypeORM with TypeScript](https://github.com/typeorm/typescript-example)
- [Example how to use TypeORM with JavaScript](https://github.com/typeorm/javascript-example)
- [Example how to use TypeORM with JavaScript and Babel](https://github.com/typeorm/babel-example)
- [Example how to use TypeORM with TypeScript and SystemJS in Browser](https://github.com/typeorm/browser-example)
- [Example how to use TypeORM with TypeScript and React in Browser](https://github.com/ItayGarin/typeorm-react-swc)
- [Example how to use Express and TypeORM](https://github.com/typeorm/typescript-express-example)
- [Example how to use Koa and TypeORM](https://github.com/typeorm/typescript-koa-example)
- [Example how to use TypeORM with MongoDB](https://github.com/typeorm/mongo-typescript-example)
- [Example how to use TypeORM in a Cordova app](https://github.com/typeorm/cordova-example)
- [Example how to use TypeORM with an Ionic app](https://github.com/typeorm/ionic-example)
- [Example how to use TypeORM with React Native](https://github.com/typeorm/react-native-example)
- [Example how to use TypeORM with Nativescript-Vue](https://github.com/typeorm/nativescript-vue-typeorm-sample)
- [Example how to use TypeORM with Nativescript-Angular](https://github.com/betov18x/nativescript-angular-typeorm-example)
- [Example how to use TypeORM with Electron using JavaScript](https://github.com/typeorm/electron-javascript-example)
- [Example how to use TypeORM with Electron using TypeScript](https://github.com/typeorm/electron-typescript-example)

## Extensions

There are several extensions that simplify working with TypeORM and integrating it with other modules:

- Models generation from the existing database - [typeorm-model-generator](https://github.com/Kononnable/typeorm-model-generator)
- Fixtures loader - [typeorm-fixtures-cli](https://github.com/RobinCK/typeorm-fixtures)
- ER Diagram generator - [typeorm-uml](https://github.com/eugene-manuilov/typeorm-uml/)
- another ER Diagram generator - [erdia](https://www.npmjs.com/package/erdia/)
- Create, drop and seed database - [typeorm-extension](https://github.com/tada5hi/typeorm-extension)
- Automatically update `data-source.ts` after generating migrations/entities - [typeorm-codebase-sync](https://www.npmjs.com/package/typeorm-codebase-sync)
- Easy manipulation of `relations` objects - [typeorm-relations](https://npmjs.com/package/typeorm-relations)
- Automatically generate `relations` based on a GraphQL query - [typeorm-relations-graphql](https://npmjs.com/package/typeorm-relations-graphql)
- Generate TypeORM entities from Valibot schemas - [piying-orm](https://github.com/piying-org/piying-orm)
- Apply REST API query parameters (fields, filters, relations, pagination, sort) to a query builder - [rapiq](https://github.com/tada5hi/rapiq)

## Contributing

Learn about contribution [here](https://github.com/typeorm/typeorm/blob/master/CONTRIBUTING.md) and how to set up your development environment [here](https://github.com/typeorm/typeorm/blob/master/DEVELOPER.md).

This project exists thanks to all the people who contribute:

<a href="https://github.com/typeorm/typeorm/graphs/contributors"><img src="https://opencollective.com/typeorm/contributors.svg?width=890&showBtn=false" /></a>

## Sponsors

Open source is hard and time-consuming. If you want to invest in TypeORM's future, you can become a sponsor and allow our core team to spend more time on TypeORM's improvements and new features.

### Champion

Become a champion sponsor and get premium technical support from our core contributors. [Become a champion](https://opencollective.com/typeorm)

<a href="https://opencollective.com/typeorm" target="_blank"><img src="https://opencollective.com/typeorm/tiers/gold-sponsor.svg?avatarHeight=36"></a>

### Supporter

Support TypeORM's development with a monthly contribution. [Become a supporter](https://opencollective.com/typeorm)

<a href="https://opencollective.com/typeorm" target="_blank"><img src="https://opencollective.com/typeorm/tiers/love.svg?avatarHeight=36"></a>

### Community

Join our community of supporters and help sustain TypeORM. [Become a community supporter](https://opencollective.com/typeorm)

<a href="https://opencollective.com/typeorm" target="_blank"><img src="https://opencollective.com/typeorm/tiers/like.svg?avatarHeight=36"></a>

### Sponsor

Make a one-time or recurring contribution of your choice. [Become a sponsor](https://opencollective.com/typeorm)

<a href="https://opencollective.com/typeorm" target="_blank"><img src="https://opencollective.com/typeorm/tiers/sponsor.svg?avatarHeight=36"></a>


## 🌐 Web Resources & Interactive Index
- [CATEGORY CAR 4](https://ptskillcrafts.pages.dev/category-car-4.html)
- [FAR ORION NEW WORLDS](https://studyplayings.pages.dev/far-orion-new-worlds.html)
- [HERO TRANSFORM RUN](https://themindplay.github.io/hero-transform-run.html)
- [NINE CARDS OF WINTER](https://thequizzone.pages.dev/nine-cards-of-winter.html)
- [COLOR WATER PUZZLE](https://studyquests.pages.dev/color-water-puzzle.html)
- [MURDER CASE CLUE 3D](https://studyplaying.github.io/murder-case-clue-3d.html)
- [NUMBER MASTER](https://learnquesters.pages.dev/number-master.html)
- [MATCH 3 DREAM ROOM](https://studyplaying.github.io/match-3-dream-room.html)
- [ROAD RACE 3D](https://learnquesters.pages.dev/road-race-3d.html)
- [METRO ESCAPE](https://studyplaying.github.io/metro-escape.html)
- [STICKMAN ZOMBIE VS STICKMAN HERO](https://studyplaying.github.io/stickman-zombie-vs-stickman-hero.html)
- [BUBBLE SHOOTER PRO 4](https://learnquesters.pages.dev/bubble-shooter-pro-4.html)
- [WORMS ZONE](https://learnquesters.pages.dev/worms-zone.html)
- [CIRCUIT MASTER](https://studyplaying.github.io/circuit-master.html)
- [WATERMELON MERGE](https://studyquests.github.io/watermelon-merge.html)
- [IDLE TRADE ISLE](https://learnquesters.pages.dev/idle-trade-isle.html)
- [HAPPY EGG CATCH](https://learnquesters.pages.dev/happy-egg-catch.html)
- [HOME PIN 1](https://learnquesters.pages.dev/home-pin-1.html)
- [CAR CARE REPAIR DUDU MECHANIC](https://quizverses.pages.dev/car-care-repair-dudu-mechanic.html)
- [FIRE BALL AND WATER BALL PARKOUR LOVE BALLS](https://learnquesters.pages.dev/fire-ball-and-water-ball-parkour-love-balls.html)
- [WAR LANDS](https://learnquester.pages.dev/war-lands.html)
- [CATEGORY MOBILE2 112](https://studyquests.pages.dev/category-mobile2-112.html)
- [PERFECT ASMR CLEANING](https://studyplaying.github.io/perfect-asmr-cleaning.html)
- [UNBLOCK IT 3D](https://studyplaying.github.io/unblock-it-3d.html)
- [OBBY RAINBOW TOWER](https://studyplaying.github.io/obby-rainbow-tower.html)
- [BLOCK PUZZLE TROPICAL STORY](https://quizverses.pages.dev/block-puzzle-tropical-story.html)
- [CATEGORY CONTROLLER](https://studyquesthub.web.app/category-controller.html)
- [SPEED RUN 3D](https://studyplaying.github.io/speed-run-3d.html)
- [BFFS Y2K FASHION](https://learnquester.pages.dev/bffs-y2k-fashion.html)
- [K POP HUNTER FASHION](https://learnquesters.pages.dev/k-pop-hunter-fashion.html)
- [DEAD ZONE MECH OPS](https://studyplaying.github.io/dead-zone-mech-ops.html)
- [PYRAMIDZ2](https://learnquester.pages.dev/pyramidz2.html)
- [SKIBIDI SURVIVOR RUSH](https://learnquesters.pages.dev/skibidi-survivor-rush.html)
- [SNAKE KING](https://quizverses.pages.dev/snake-king.html)
- [CRAFT DRILL](https://studyquests.github.io/craft-drill.html)
- [CATEGORY AVOID295](https://studyquests.github.io/category-avoid295.html)
- [MONSTER MAKEUP 3D](https://quizverses.pages.dev/monster-makeup-3d.html)
- [CATEGORY GROW99](https://learnquesters.pages.dev/category-grow99.html)
- [HAPPY FRUIT LINK](https://learnquesters.pages.dev/happy-fruit-link.html)
- [FREE HOOPS](https://thelearnquesters.pages.dev/free-hoops.html)
- [STICKMAN ROGUE ONLINE](https://studyplaying.github.io/stickman-rogue-online.html)
- [BACKWOODS](https://learnquester.pages.dev/backwoods.html)
- [WORD STARS](https://thelearnquesters.pages.dev/word-stars.html)
- [TANKS](https://studyplaying.github.io/tanks.html)
- [GIRLS FUN NAIL SALON](https://thelearnquesters.pages.dev/girls-fun-nail-salon.html)
- [BOSS MARKET](https://studyplaying.github.io/boss-market.html)
- [MEME CHALLENGEIO](https://studyplaying.github.io/meme-challengeio.html)
- [GOKARTS IO](https://thelearnquesters.pages.dev/gokarts-io.html)
- [CAT FOOTBALL](https://studyplaying.github.io/cat-football.html)
- [GOLD MINER CLASSIC](https://studyplaying.github.io/gold-miner-classic.html)
- [DARK STONES CARD BATTLE RPG](https://studyplaying.github.io/dark-stones-card-battle-rpg.html)
- [SNAKE PUZZLE ESCAPE](https://thelearnquesters.pages.dev/snake-puzzle-escape.html)
- [CATEGORY FPS](https://thelearnquesters.pages.dev/category-fps.html)
- [MERGEDUELIO](https://studyquests.github.io/mergeduelio.html)
- [POTION MERGE WITCH](https://learnquesters.pages.dev/potion-merge-witch.html)
- [FAMILY TREE PUZZLE](https://thelearnquesters.pages.dev/family-tree-puzzle.html)
- [SUPER TANK WRESTLE](https://studyplaying.github.io/super-tank-wrestle.html)
- [MEATRIDER](https://learnquester.pages.dev/meatrider.html)
- [SPRUNKI MINI GAMES](https://learnquesters.pages.dev/sprunki-mini-games.html)
- [CLASH OF STONE](https://quizverses.pages.dev/clash-of-stone.html)
- [MALL ANOMALY](https://studyplaying.github.io/mall-anomaly.html)
- [CATEGORY 1 PLAYER139](https://studyquests.github.io/category-1-player139.html)
- [CANDY LOVE](https://learnquesters.pages.dev/candy-love.html)
- [WOOD NUTS MASTER SCREW PUZZLE](https://learnquester.pages.dev/wood-nuts-master-screw-puzzle.html)
- [TUNG TUNG SAHUR COLORING BOOK](https://learnquesters.pages.dev/tung-tung-sahur-coloring-book.html)
- [SLOPE SPOOKY](https://thelearnquesters.pages.dev/slope-spooky.html)
- [CATEGORY MOBILE2 097](https://learnquesters.pages.dev/category-mobile2-097.html)
- [CATEGORY GUN241](https://thelearnquesters.pages.dev/category-gun241.html)
- [PAWS OFF MY CLUES](https://studyplaying.github.io/paws-off-my-clues.html)
- [INDEX16](https://learnquesters.pages.dev/index16.html)
- [MOJICON EMOJI CONNECT](https://quizverses.pages.dev/mojicon-emoji-connect.html)
- [CATEGORY CARDS](https://learnquesters.pages.dev/category-cards.html)
- [HOUSE ROBBER](https://studyquests.github.io/house-robber.html)
- [HEROIC KNIGHT](https://learnquesters.pages.dev/heroic-knight.html)
- [FUN MINI GAMES FOR PRINCESS](https://quizverses.pages.dev/fun-mini-games-for-princess.html)
- [CATEGORY HORROR 3](https://thelearnquesters.pages.dev/category-horror-3.html)
- [INDEX34](https://studyquests.github.io/index34.html)
- [PAPA BUZJA](https://learnquesters.pages.dev/papa-buzja.html)
- [KNOCK AND RUN 100 DOORS ESCAPE](https://learnquesters.pages.dev/knock-and-run-100-doors-escape.html)
- [FARM MATCH SEASONS 2](https://thelearnquesters.pages.dev/farm-match-seasons-2.html)
- [HUNGRY SNAKE IO](https://studyplaying.github.io/hungry-snake-io.html)
- [MY PERFECT FARM](https://thelearnquesters.pages.dev/my-perfect-farm.html)
- [INDEX4](https://learnquesters.pages.dev/index4.html)
- [CLASH RUN](https://learnquesters.pages.dev/clash-run.html)
- [TILES MATCHING](https://studyplayings.web.app/tiles-matching.html)
- [AIR BLOCK](https://learnquester.pages.dev/air-block.html)
- [ITALIAN BRAINROT CLICKER](https://studyquesthub.web.app/italian-brainrot-clicker.html)
- [THE PATAGONIANS](https://studyquests.github.io/the-patagonians.html)
- [ELLIE CHINESE NEW YEAR CELEBRATION](https://learnquesters.pages.dev/ellie-chinese-new-year-celebration.html)
- [CATEGORY CASUAL](https://learnquesters.pages.dev/category-casual.html)
- [FISHING LIFE](https://quizverses.pages.dev/fishing-life.html)
- [BASKETBALL RUSH](https://learnquesters.pages.dev/basketball-rush.html)
- [OFFROAD LIFE 3D](https://learnquester.pages.dev/offroad-life-3d.html)
- [MERGE MASTER](https://thelearnquesters.pages.dev/merge-master.html)
- [STICKMAN ARMY TEAM BATTLE](https://studyplayings.web.app/stickman-army-team-battle.html)
- [ROPE COLOR SORT 3D](https://thelearnquesters.pages.dev/rope-color-sort-3d.html)
- [CATEGORY AVOID](https://studyquests.github.io/category-avoid.html)
- [CATEGORY ESCAPE](https://thelearnquesters.pages.dev/category-escape.html)
- [CATEGORY DRESS UP 2](https://studyquests.github.io/category-dress-up-2.html)
- [HERO TOWER WARS MERGE PUZZLE](https://learnquesters.pages.dev/hero-tower-wars-merge-puzzle.html)
- [OFFICE PYRAMID SOLITAIRE](https://learnquesters.pages.dev/office-pyramid-solitaire.html)
- [CATEGORY ESCAPE 2](https://thelearnquesters.pages.dev/category-escape-2.html)
- [CARD MASTER](https://thelearnquesters.pages.dev/card-master.html)
- [PING PONG AIR](https://studyplaying.github.io/ping-pong-air.html)
- [SWIPETOWN](https://learnquester.pages.dev/swipetown.html)
- [CATEGORY AGILITY 2](https://quizverses.github.io/category-agility-2.html)
- [WOODY TAP BLOCK](https://quizverses.pages.dev/woody-tap-block.html)
- [ZOMBIES BATTLE FOR SURVIVAL](https://thelearnquesters.pages.dev/zombies-battle-for-survival.html)
- [SCHOOL TEACHER SIMULATOR](https://studyplaying.github.io/school-teacher-simulator.html)
- [VALENTINES MAKEUP TRENDS](https://learnquester.pages.dev/valentines-makeup-trends.html)
- [CATEGORY RPG](https://thelearnquesters.pages.dev/category-rpg.html)
- [MERGE CAR DEFENSE](https://studyplaying.github.io/merge-car-defense.html)
- [PARKOUR BLOCK OBBY](https://studyquests.github.io/parkour-block-obby.html)
- [FUNNY BALLS 2048](https://studyplayings.web.app/funny-balls-2048.html)
- [SUPER SOCCER NOGGINS](https://studyplaying.github.io/super-soccer-noggins.html)
- [STRIKE IT](https://quizverses-9d2f2.web.app/strike-it.html)
- [MEGA SHARK](https://learnquesters.pages.dev/mega-shark.html)
- [SOLITAIRE MATCH](https://studyplaying.github.io/solitaire-match.html)
- [TILE FARM STORY MATCHING GAME](https://studyplayings.web.app/tile-farm-story-matching-game.html)
- [BADLAND](https://studyquests.github.io/badland.html)
- [SHADOW STICKMAN FIGHT](https://studyplaying.github.io/shadow-stickman-fight.html)
- [INDEX38](https://studyquests.github.io/index38.html)
- [RED STICKMAN VS CRAFTMANS](https://studyplaying.github.io/red-stickman-vs-craftmans.html)
- [I8 CITY DRIVER](https://learnquester.pages.dev/i8-city-driver.html)
- [SQUID ESCAPE BUT BLOCKWORLD](https://quizverses-9d2f2.web.app/squid-escape-but-blockworld.html)
- [STICKMAN SORT](https://thelearnquesters.pages.dev/stickman-sort.html)
- [DUNK CHALLENGE](https://studyplayings.web.app/dunk-challenge.html)
- [RESTAURANT VIP MASTERCHEF](https://studyplaying.github.io/restaurant-vip-masterchef.html)
- [MERMAIDCORE MAKEUP](https://quizverses.github.io/mermaidcore-makeup.html)
- [MUSHROOM FEVER MATCH 3](https://quizverses-9d2f2.web.app/mushroom-fever-match-3.html)
