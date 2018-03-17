export class ObjectInstantiator {

    static createInstanceWithoutConstructor<T>(objectClass: { new (): T }): T {
        class NewObject {}
        NewObject.prototype = objectClass.prototype;

        return <T> new NewObject();
    }

}
