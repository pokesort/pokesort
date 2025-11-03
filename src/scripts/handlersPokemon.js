import { getDb } from "@/lib/mongodb";

export async function handlerEvolutionStep(step, filter) {

  if (step === "no_line") return await handlerNoLine();

  else if (step === "is_split") return await handlerIsSplit();

  else if (step === "has_split") return await handlerHasSplit();

  filter.evolution_step = { $regex: `-${step}$` };
  return [];
}

export async function handlerNoLine() {
  const db = getDb();
  const basePokemons = await db.db.collection('pokemon').aggregate([
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

  const extraForms = await db.db.collection("pokemon").find({
    name: { $regex: /-(mega|gmax)$/ },
    species_name: { $in: speciesNames }
  }).project({ id: 1, _id: 0 }).toArray();

  const extraIds = extraForms.map(f => f.id);

  return [...baseIds, ...extraIds];
}

export async function handlerEvolutionMethod(methods) {
  const db = getDb();
  const pokemonsWithMethod = await db.db.collection('pokemon').aggregate([
    {
      $lookup: {
        from: "evolution_steps",
        let: { pokemonId: "$id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$pokemon", "$$pokemonId"] },
              methods: methods
            }
          },
          { $project: { _id: 0, pokemon: 1 } }
        ],
        as: "evo_data"
      }
    },
    {
      $match: {
        "evo_data.0": { $exists: true } // só mantém os que têm correspondência
      }
    },
    {
      $project: {
        id: 1,
        _id: 0
      }
    }
  ]).toArray();

  return pokemonsWithMethod.map(p => p.id);
}

export async function handlerIsSplit() {
  const db = getDb();
  const splitPokemons = await db.db.collection('pokemon').aggregate([
    {
      $lookup: {
        from: "evolution_steps",
        let: { evoId: "$evolution_step" },
        pipeline: [
          { $match: { $expr: { $eq: ["$id", "$$evoId"] } } },
          { $project: { id: 1, is_split: 1, _id: 0 } },
          { $match: { is_split: 1 } }
        ],
        as: "evo_data"
      }
    },
    {
      $addFields: {
        evo_data_first: { $arrayElemAt: ["$evo_data", 0] }
      }
    },
    {
      $match: {
        evo_data_first: { $exists: true }
      }
    },
    {
      $project: {
        id: 1,
        _id: 0
      }
    }
  ]).toArray();

  const validSteps = splitPokemons.map(p => p.id);

  return validSteps;
}

export async function handlerHasSplit() {
  const db = getDb();
  const splitPokemons = await db.db.collection('pokemon').aggregate([
    {
      $lookup: {
        from: "evolution_steps",
        let: { evoId: "$evolution_step" },
        pipeline: [
          { $match: { $expr: { $eq: ["$id", "$$evoId"] } } },
          { $project: { id: 1, has_split: 1, _id: 0 } },
          { $match: { has_split: 1 } }
        ],
        as: "evo_data"
      }
    },
    {
      $addFields: {
        evo_data_first: { $arrayElemAt: ["$evo_data", 0] }
      }
    },
    {
      $match: {
        evo_data_first: { $exists: true }
      }
    },
    {
      $project: {
        id: 1,
        _id: 0
      }
    }
  ]).toArray();

  const validSteps = splitPokemons.map(p => p.id);
  return validSteps;
}

export async function handlerOtherForms(others, filter) {
  filter.other_forms = { $exists: true, $ne: [] };
  filter.is_default = others == 1 ? true : false;
}

export async function handlerRelationTo(typeId, expression) {
  const db = getDb();

  const pipeline = [
    {
      $lookup: {
        from: "types",
        localField: "types",
        foreignField: "id",
        as: "type_data"
      }
    },
    {
      $project: {
        id: 1,
        name: 1,
        species_name: 1,
        types: 1,
        multipliers: {
          $map: {
            input: "$type_data",
            as: "type",
            in: {
              $ifNull: [`$$type.matchups.${typeId}`, 1] // fallback para 1 se não existir
            }
          }
        }
      }
    },
    {
      $addFields: {
        total_multiplier: {
          $reduce: {
            input: "$multipliers",
            initialValue: 1,
            in: { $multiply: ["$$value", "$$this"] }
          }
        }
      }
    },
    {
      $match: {
        total_multiplier: expression
      }
    },
    {
      $project: {
        _id: 0,
        id: 1
      }
    }
  ];

  const results = await db.db.collection("pokemon").aggregate(pipeline).toArray();

  const ids = results.map(p => p.id);

  return ids;
}

export async function handlerEvolutionChain(form) {

  if (form == "first") return await handlerFirstInChain();

  else if (form == "middle") return await handlerMiddleInChain();

  else if (form == "final") return await handlerFinalInChain();
}

export async function handlerFirstInChain() {
  const db = getDb();
  const pipeline = [
    {
      $match: {
        evolution_step: { $ne: null },
        step_override: { $nin: ["middle", "final"] }
      }
    },
    {
      $addFields: {
        parts: { $split: ["$evolution_step", "-"] }
      }
    },
    {
      $addFields: {
        step: { $toInt: { $arrayElemAt: ["$parts", -1] } },
        chain_id: {
          $cond: {
            if: { $eq: [{ $size: "$parts" }, 3] },
            then: {
              $concat: [
                { $arrayElemAt: ["$parts", 0] },
                "-",
                { $arrayElemAt: ["$parts", 1] }
              ]
            },
            else: { $arrayElemAt: ["$parts", 0] }
          }
        }
      }
    },
    {
      $group: {
        _id: "$chain_id",
        steps: { $addToSet: "$step" },
        pokemons: { $push: "$$ROOT" }
      }
    },
    {
      $match: {
        $expr: {
          $and: [
            { $in: [0, "$steps"] },
            { $gt: [{ $size: { $ifNull: ["$steps", []] } }, 1] }
          ]
        }
      }
    },
    { $unwind: "$pokemons" },
    { $match: { "pokemons.step": 0 } },
    { $project: { _id: 0, id: "$pokemons.id" } },
    {
      $unionWith: {
        coll: "pokemon",
        pipeline: [
          { $match: { step_override: "first" } },
          { $project: { _id: 0, id: 1 } }
        ]
      }
    }
  ];

  const result = await db.db.collection("pokemon").aggregate(pipeline).toArray();

  return result.map(p => p.id);
}

export async function handlerMiddleInChain() {
  const db = getDb();
  const pipeline = [
    {
      $match: {
        evolution_step: { $ne: null },
        step_override: { $nin: ["first", "final"] }
      }
    },
    {
      $addFields: {
        parts: { $split: ["$evolution_step", "-"] }
      }
    },
    {
      $addFields: {
        step: { $toInt: { $arrayElemAt: ["$parts", -1] } },
        chain_id: {
          $cond: {
            if: { $eq: [{ $size: "$parts" }, 3] },
            then: {
              $concat: [
                { $arrayElemAt: ["$parts", 0] },
                "-",
                { $arrayElemAt: ["$parts", 1] }
              ]
            },
            else: { $arrayElemAt: ["$parts", 0] }
          }
        }
      }
    },
    {
      $group: {
        _id: "$chain_id",
        steps: { $addToSet: "$step" },
        pokemons: { $push: "$$ROOT" }
      }
    },
    {
      $match: {
        $expr: {
          $and: [
            { $in: [0, "$steps"] },
            { $in: [1, "$steps"] },
            { $in: [2, "$steps"] }
          ]
        }
      }
    },
    { $unwind: "$pokemons" },
    { $match: { "pokemons.step": 1 } },
    { $project: { _id: 0, id: "$pokemons.id" } },
    {
      $unionWith: {
        coll: "pokemon",
        pipeline: [
          { $match: { step_override: "middle" } },
          { $project: { _id: 0, id: 1 } }
        ]
      }
    }
  ];

  const result = await db.db.collection("pokemon").aggregate(pipeline).toArray();
  return result.map(p => p.id);
}

export async function handlerFinalInChain() {
  const db = getDb();
  const pipeline = [
    {
      $match: {
        evolution_step: { $ne: null },
        step_override: { $nin: ["first", "middle"] }
      }
    },
    {
      $addFields: {
        parts: { $split: ["$evolution_step", "-"] }
      }
    },
    {
      $addFields: {
        step: { $toInt: { $arrayElemAt: ["$parts", -1] } },
        chain_id: {
          $cond: {
            if: { $eq: [{ $size: "$parts" }, 3] },
            then: {
              $concat: [
                { $arrayElemAt: ["$parts", 0] },
                "-",
                { $arrayElemAt: ["$parts", 1] }
              ]
            },
            else: { $arrayElemAt: ["$parts", 0] }
          }
        }
      }
    },
    {
      $group: {
        _id: "$chain_id",
        maxStep: { $max: "$step" },
        steps: { $addToSet: "$step" },
        pokemons: { $push: "$$ROOT" }
      }
    },
    {
      $match: {
        $expr: { $gt: [{ $size: "$steps" }, 1] } // filtra cadeias com mais de 1 step
      }
    },
    { $unwind: "$pokemons" },
    {
      $match: {
        $expr: { $eq: ["$pokemons.step", "$maxStep"] }
      }
    },
    {
      $project: {
        _id: 0,
        id: "$pokemons.id"
      }
    },
    {
      $unionWith: {
        coll: "pokemon",
        pipeline: [
          { $match: { step_override: "final" } },
          { $project: { _id: 0, id: 1 } }
        ]
      }
    }
  ];

  const result = await db.db.collection("pokemon").aggregate(pipeline).toArray();
  return result.map(p => p.id);
}

export async function handlerDualTypes(dual, filter) {

  const newAnd = [];

  if (filter.$and) {
    newAnd.push(...filter.$and);
  } else {
    newAnd.push(filter);
  }

  if (filter.types !== undefined) {
    newAnd.push({ types: filter.types });
  }

  newAnd.push({ types: { $size: dual } });

  filter = { $and: newAnd };

  return filter;
}

export async function handleMaxGeneration(max_generation, filter) {
  const newAnd = [];

  if (filter.$and) {
    newAnd.push(...filter.$and);
  } else {
    newAnd.push(filter);
  }

  if (filter.generation !== undefined) {
    newAnd.push({ generation: filter.generation });
  }

  newAnd.push({ generation: { $lte: max_generation } });

  filter = { $and: newAnd };

  return filter;
}

export async function handleSearch(search, filter) {
  const newAnd = [];

  if (filter.$and) {
    newAnd.push(...filter.$and);
  } else {
    newAnd.push(filter);
  }

  if (search && search.trim() !== "") {
    newAnd.push({ name: { $regex: search, $options: "i" } });
  }

  filter = { $and: newAnd };

  return filter;
}