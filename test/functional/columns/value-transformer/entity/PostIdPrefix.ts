class PostIdPrefix {
  private value: string;

  private constructor(value: string) {
    // add lowercase guard for example
    this.value = value;
  }

  static fromString(id: string): PostIdPrefix {
    return new this(id);
  }

  toString(): string {
    return this.value;
  }
}

export { PostIdPrefix };

