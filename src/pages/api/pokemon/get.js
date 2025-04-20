import { connect, data } from "@/lib/mongodb";
import { log } from "console";

export default async function handler(req, res) {
  try {
    await connect();

    const filter = {};
    const arrayFields = ["types", "abilities", "moves", "egg_groups", "categories", "other_forms"];
    const booleanFields = ["is_default"];
    
    const step = req.query.evolution_step
    
    if (step != undefined){
        handlerEvolutionStep(step, filter)
        delete req.query.evolution_step
    }

    for (const [key, value] of Object.entries(req.query)) {
        if (arrayFields.includes(key)) {
            filter[key] = { $all: Array.isArray(value) ? value : [value] };
        } else if (booleanFields.includes(key)) {
            filter[key] = value === "true";
        } else {
            filter[key] = value;
        }
    }

    const pokemons = await data.db.collection('pokemon').find(filter).toArray();

    res.status(200).json({ success: true, pokemons: pokemons.map((col) => col.name) });
    // res.status(200).json({ success: true });
  } catch (error) {
    console.error("Connection failed:", error);
    res.status(500).json({ success: false, error: error.message });
  } finally {

  }
}

function handlerEvolutionStep(step, filter){

    if (step === "null") {
        filter.evolution_step = { $in: [null, undefined] };
    } else {
        filter.evolution_step = { $regex: `-${step}$` };
    }
}