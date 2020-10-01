import "reflect-metadata";
import {ConnectionOptions, createConnection} from "../../src/index";
import {Profile} from "./entity/Profile";
import {User} from "./entity/User";

const options: ConnectionOptions = {
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "username",
    password: "password",
    database: "test",
    logging: ["query", "error"],
    synchronize: true,
    entities: [Profile, User]
};

createConnection(options).then(async connection => {

    const userRepository = connection.getRepository(User);
    const profileRepository = connection.getRepository(Profile);

    console.log("Inserting a new user into the database...");
    const user = new User();
    user.name = "gaurav";
    await userRepository.save(user);
    console.log("Saved a new user with id: " + user.id);

    console.log("Inserting a new profile and linking with the user into the database...");
    const profile = new Profile();
    profile.gender = "Male";
    profile.photo = "profile_url";
    profile.user = await userRepository.findOneOrFail(user.id);
    await profileRepository.save(profile);
    console.log("Saved a new profile with data: " + profile);

    console.log("Delete referencing row in order to delete profile and user in cascade fashion...");
    await profileRepository.remove(profile);

    console.log("Loading users from the database...");
    const users = await userRepository.find();
    console.log("Loaded users: ", users);

    console.log("Loading profiles from the database...");
    const profiles = await profileRepository.find();
    console.log("Loaded profiles: ", profiles);

    console.log("This is how you can delete rows from both tables in case of one-to-one relation");

}, error => console.log("Cannot connect: ", error));
