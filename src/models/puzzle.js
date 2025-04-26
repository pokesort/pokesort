import { data } from "../../lib/mongodb";
import mongoose from "mongoose";

const PuzzleSchema = new mongoose.Schema({
  groups: {
    type: [mongoose.Schema.Types.ObjectId],
    required: true,
    ref: "Group",
    validate: [
      {
        validator: (v) => v.length >= 4 && v.length <= 5,
        message: "Um puzzle deve ter entre 4 e 5 grupos."
      }
    ]
  },
  date: {
    type: Date,
    default: null
  },
  origin: {
    type: String,
    enum: ["system", "admin", "user"],
    required: true
  },
  author: {
    type: String,
    required: true
  }
});

export const Puzzle = data.model('Puzzle', PuzzleSchema);
