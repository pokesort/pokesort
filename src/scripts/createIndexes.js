import { connect, data } from "../../lib/mongodb.js";
import mongoose from "mongoose";

const createIndexes = async () => {
  await connect();

  const pokemon = data.collection("pokemon");
  const evolutionSteps = data.collection("evolution_steps");
  const types = data.collection("types");

  try {
    await pokemon.createIndex({ id: 1 }, { unique: true });
    await pokemon.createIndex({ evolution_step: 1 });
    await pokemon.createIndex({ name: 1 });
    await pokemon.createIndex({ species_name: 1 });
    await pokemon.createIndex({ types: 1 });
    await pokemon.createIndex({ abilities: 1 });
    await pokemon.createIndex({ moves: 1 });
    await pokemon.createIndex({ egg_groups: 1 });
    await pokemon.createIndex({ categories: 1 });
    await pokemon.createIndex({ other_forms: 1 });
    await pokemon.createIndex({ is_default: 1 });

    await evolutionSteps.createIndex({ id: 1 });
    await evolutionSteps.createIndex({ pokemon: 1 });
    await evolutionSteps.createIndex({ methods: 1 });
    await evolutionSteps.createIndex({ is_split: 1 });
    await evolutionSteps.createIndex({ has_split: 1 });

    await types.createIndex({ id: 1 }, { unique: true });

    console.log("Índices criados com sucesso.");
  } catch (err) {
    console.error("Erro ao criar índices:", err);
  } finally {
    mongoose.disconnect();
  }
};

createIndexes();
