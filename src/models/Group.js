import { data } from "../../lib/mongodb";
import mongoose from "mongoose";

const GroupSchema = new mongoose.Schema({
  pokemons: {
    type: [Number],
    required: true,
    validate: [
      {
        validator: (v) => v.length >= 4 && v.length <= 6,
        message: "Um grupo deve ter entre 4 e 6 Pokémon."
      }
    ]
  },
  categories: {
    type: String,
    required: true
  }
});

export const Group = data.model('Group', GroupSchema);
