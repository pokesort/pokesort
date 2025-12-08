export class FetchPokemonError extends Error {
  constructor(message) {
    super(message);
    this.name = "FetchPokemonError";
  }
}

export class MaxAttemptsError extends Error {
  constructor(message) {
    super(message);
    this.name = "MaxAttemptsError";
  }
}

export class NotEnoughFieldsError extends Error {
  constructor(message) {
    super(message);
    this.name = "NotEnoughFieldsError";
  }
}