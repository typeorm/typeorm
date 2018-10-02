export class FirebirdError extends Error {
    constructor(erro: string) {
        super();
        this.message = "Firebird error: " + erro;
    }
}