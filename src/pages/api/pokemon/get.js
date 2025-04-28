import { connect, data } from "@/lib/mongodb";

export default async function handler(req, res) {
  try {
    await connect();

    const filter = {};
    const arrayFields = ["types", "abilities", "moves", "egg_groups", "categories", "other_forms"];
    const booleanFields = ["is_default"];

    const step = req.query.step;
    const methods = req.query.methods
    const others = req.query.others


    if (step !== undefined) {
      await handlerEvolutionStep(step, filter);
      delete req.query.step;
    }

    if (methods !== undefined) {
      filter.id = await handlerEvolutionMethod(parseInt(methods));
      delete req.query.methods;
    }

    if (others != undefined) {
      await handlerOtherForms(parseInt(others), filter);
      delete req.query.others;
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

    res.status(200).json({ success: true, pokemons: pokemons.map((col) => ({name : col.name, id: col.id, species_name: col.species_name})) });
  } catch (error) {
    console.error("Connection failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function handlerEvolutionStep(step, filter) {
  if (step === "no_line") {
    // filter.evolution_step = { $in: [null, undefined] };
    filter.id = await handlerNoLine()

  } else if (step === "is_split") {
    filter.evolution_step = await handlerIsSplit();
  } else if (step === "has_split"){
    filter.evolution_step = await handlerHasSplit();
  } else {
    filter.evolution_step = { $regex: `-${step}$` };
  }
}

async function handlerNoLine() {
  const basePokemons = await data.db.collection('pokemon').aggregate([
    {
      $lookup: {
        from: "evolution_steps",
        localField: "evolution_step",
        foreignField: "id",
        as: "evo_data"
      }
    },
    { $unwind: "$evo_data" },
    {
      $addFields: {
        split_parts: { $split: ["$evo_data.id", "-"] }
      }
    },
    {
      $addFields: {
        step: { $toInt: { $arrayElemAt: ["$split_parts", -1] } },
        chain_id: {
          $cond: {
            if: { $eq: [{ $size: "$split_parts" }, 3] },
            then: {
              $concat: [
                { $arrayElemAt: ["$split_parts", 0] },
                "-",
                { $arrayElemAt: ["$split_parts", 1] }
              ]
            },
            else: { $arrayElemAt: ["$split_parts", 0] }
          }
        }
      }
    },
    {
      $group: {
        _id: "$chain_id",
        pokemons: {
          $push: {
            id: "$id",
            evolution_step: "$evolution_step",
            name: "$name",
            species_name: "$species_name",
            step: "$step"
          }
        },
        count: { $sum: 1 },
        distinctSteps: { $addToSet: "$step" }
      }
    },
    {
      $match: {
        $or: [
          { count: 1 },
          { distinctSteps: { $size: 1 }, "distinctSteps.0": 0 }
        ]
      }
    },
    { $unwind: "$pokemons" },
    {
      $project: {
        _id: 0,
        id: "$pokemons.id",
        name: "$pokemons.name",
        species_name: "$pokemons.species_name"
      }
    }
  ]).toArray();

  const baseIds = basePokemons.map(p => p.id);

  const speciesNames = basePokemons.map(p => p.species_name);

  const extraForms = await data.db.collection("pokemon").find({
    name: { $regex: /-(mega|gmax)$/ },
    species_name: { $in: speciesNames }
  }).project({ id: 1, _id: 0 }).toArray();

  const extraIds = extraForms.map(f => f.id);

  return { $in: [...baseIds, ...extraIds] };
}

async function handlerEvolutionMethod(methods) {
  const pokemonsWithMethod = await data.db.collection('pokemon').aggregate([
    {
      $lookup: {
        from: "evolution_steps",
        localField: "id",
        foreignField: "pokemon",
        as: "evo_data"
      }
    },
    { $unwind: "$evo_data" },
    {
      $match: {
        "evo_data.methods": methods
      }
    },
    {
      $project: {
        id: 1,
        _id: 0
      }
    }
  ]).toArray();

  const ids = pokemonsWithMethod.map(p => p.id);

  return { $in: ids };
}

async function handlerIsSplit() {
  const splitPokemons = await data.db.collection('pokemon').aggregate([
    {
      $lookup: {
        from: "evolution_steps",              // coleção relacionada
        localField: "evolution_step",         // campo em 'pokemon'
        foreignField: "id",                   // campo em 'evolution_steps'
        as: "evo_data"
      }
    },
    { $unwind: "$evo_data" },

    {
      $match: {
        "evo_data.is_split": 1 // aqui está o filtro
      }
    },
    {
      $project: {
        evolution_step: 1,
        _id: 0
      }
    }
  ]).toArray();

  const validSteps = splitPokemons.map(p => p.evolution_step);
  return { $in: validSteps };
}

async function handlerHasSplit() {
  const splitPokemons = await data.db.collection('pokemon').aggregate([
    {
      $lookup: {
        from: "evolution_steps",              // coleção relacionada
        localField: "evolution_step",         // campo em 'pokemon'
        foreignField: "id",                   // campo em 'evolution_steps'
        as: "evo_data"
      }
    },
    { $unwind: "$evo_data" },

    {
      $match: {
        "evo_data.has_split": 1 // aqui está o filtro
      }
    },
    {
      $project: {
        evolution_step: 1,
        _id: 0
      }
    }
  ]).toArray();

  const validSteps = splitPokemons.map(p => p.evolution_step);
  return { $in: validSteps };
}

async function handlerOtherForms(others, filter) {
  filter.other_forms = { $exists: true, $ne: [] }; // array não vazio
  filter.is_default = others == 1 ? true : false;
}
