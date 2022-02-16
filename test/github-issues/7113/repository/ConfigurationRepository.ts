import { EntityRepository, MongoRepository, ObjectID } from "../../../../src";
import { Configuration } from "../entity/Configuration";

@EntityRepository(Configuration)
export class ConfigurationRepository extends MongoRepository<Configuration> {

  async findAllConfigurations(): Promise<Configuration[]> {
    const configurations = await this.find();
    return configurations;
  }

  async deleteConfiguration(
    configuration: Configuration
  ): Promise<ObjectID> {
    await this.softRemove(configuration);
    return configuration._id;
  }
}