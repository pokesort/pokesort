import { connect, getDb } from "@/lib/mongodb";
import { pickRandom, randomInRange, FIELD_OPTIONS } from "../../../scripts/utils";
import { filterPokemons } from "../../../scripts/server_utils";

export default async function handler(req, res) {
  try {
    await connect();
    const db = getDb();

    const attributesAmount = 5;
    const usedPokemonIds = new Set();

    let secretPokemon = null;

    let fieldSelecteds = await getRandomFieldAndValue();
    let pokemons = await getPokemonsByFieldAndValue(fieldSelecteds.field, fieldSelecteds.value);

    secretPokemon = await selectSecretPokemon(pokemons);
    let secretPokemonData = await getPokemonById(db, secretPokemon.id);

    if (!secretPokemon) {
      res.status(404).json({ success: false, error: "Pokemon não encontrado" })
    }
    res.status(200).json({ success: true, fieldSelecteds, pokemons, secretPokemon, secretPokemonData });

  } catch (error) {
    console.error("Connection failed:", error);
    res.status(500).json({ success: false, error: error.message });
  } finally {

  }
}

async function getRandomFieldAndValue() {
  const fields = Object.keys(FIELD_OPTIONS);

  if (fields.length === 0) return null;

  const field = pickRandom(fields)[0];
  const options = FIELD_OPTIONS[field];

  let value;

  if (Array.isArray(options)) {

    if (options.length === 0) return null;
    value = pickRandom(options)[0];

  }
  else if (typeof options === "object" && options.min !== undefined && options.max !== undefined) {
    value = randomInRange(options.min, options.max);
  }
  else return null;

  return {
    field,
    value
  };
}

async function getPokemonsByFieldAndValue(field, value) {
    const query = {[field]: value};

    const pokemons = await filterPokemons(query);

    if (!pokemons || pokemons.length < 6) {
        return null;
    }

    return pickRandom(pokemons, 6);
}

async function selectSecretPokemon(pokemons) {
    if (!pokemons || pokemons.length !== 6) {
        return null;
    }

    return pickRandom(pokemons)[0];
}

async function getPokemonById(db, id) {
    return await db.db.collection("pokemon").findOne({
        id: Number(id)
    });
}