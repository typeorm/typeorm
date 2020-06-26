import "source-map-support/register";
import "reflect-metadata";
import * as chai from "chai";
import * as sinon_chai from 'sinon-chai';
import * as chai_as_promised from 'chai-as-promised';

chai.should();
chai.use(sinon_chai);
chai.use(chai_as_promised);
