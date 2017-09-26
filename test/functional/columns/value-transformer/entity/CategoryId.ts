class CategoryId {
  private value: string;

  private constructor(value: string) {
    // add uuid guard for example
    this.value = value;
  }

  static fromString(id: string): CategoryId {
    return new this(id);
  }

  toString(): string {
    return this.value;
  }
}

export { CategoryId };

