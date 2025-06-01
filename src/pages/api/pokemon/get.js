import { connect, data } from "@/lib/mongodb";

export default async function handler(req, res) {
  try {
    await connect();

    let filter = {};
    const arrayFields = ["types", "abilities", "moves", "egg_groups", "categories", "other_forms"];
    const booleanFields = ["is_default"];

    const step = req.query.step;

    const methods = req.query.methods;
    const others = req.query.others;
    const weak = req.query.weak;
    const strong = req.query.strong;
    const immune = req.query.immune;
    const form = req.query.form;
    const dual = req.query.dual;

    const relations_query = {
      "weak": { $gte: 2 },
      "strong": { $gt: 0, $lt: 1 },
      "immune": { $eq: 0 },
    }
    let pokemonIds = [];
    
    if (step !== undefined) {
      const steps = Array.isArray(step) ? step : [step];
    
      const results = await Promise.all(steps.map(step => handlerEvolutionStep(step, filter)));
      pokemonIds = results.flat();

      delete req.query.step;
    }
    
    if (methods !== undefined) {
      const methodsIds = await handlerEvolutionMethod(parseInt(methods));
      pokemonIds = pokemonIds.length > 0 ? methodsIds.filter(value => pokemonIds.includes(value)) : methodsIds;

      delete req.query.methods;
    }
    
    if (others != undefined) {
      await handlerOtherForms(parseInt(others), filter);
      delete req.query.others;
    }
    
    if (weak != undefined) {
      const weakIds = await handlerRelationTo(weak, relations_query["weak"]);
      pokemonIds = pokemonIds.length > 0 ? weakIds.filter(value => pokemonIds.includes(value)) : weakIds;
      delete req.query.weak;
    }
    
    if (strong != undefined) {

      const strongIds = await handlerRelationTo(strong, relations_query["strong"]);
      pokemonIds = pokemonIds.length > 0 ? strongIds.filter(value => pokemonIds.includes(value)) : strongIds;
      delete req.query.strong;
      
    }
    
    if (immune != undefined) {

      const immuneIds = await handlerRelationTo(immune, relations_query["immune"]);
      pokemonIds = pokemonIds.length > 0 ? immuneIds.filter(value => pokemonIds.includes(value)) : immuneIds;
      delete req.query.immune;

    }
    if (form != undefined){

      const evoIds = await handlerEvolutionChain(form);
      pokemonIds = pokemonIds.length > 0 ? evoIds.filter(value => pokemonIds.includes(value)) : evoIds;
      delete req.query.form;

    }

    if (dual != undefined) delete req.query.dual;
    
    if (pokemonIds.length > 0){
      pokemonIds = pokemonIds.filter((item, index) => pokemonIds.indexOf(item) === index);
      filter.id = {$in: pokemonIds};
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

    if (dual != undefined){
      filter = await handlerDualTypes(parseInt(dual), filter);
    }

    console.log(filter);


  let pokemons = await data.db.collection('pokemon').find(filter, { projection: { name: 1, id: 1, species_name: 1, dex_number: 1, _id: 0 } }).sort({ dex_number: 1, id: 1}).toArray();

    res.status(200).json({ success: true, pokemons });
  } catch (error) {
    console.error("Connection failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function handlerEvolutionStep(step, filter) {
  
  if (step === "no_line") return await handlerNoLine();
  
  else if (step === "is_split") return await handlerIsSplit();
    
  else if (step === "has_split") return await handlerHasSplit();

  filter.evolution_step = { $regex: `-${step}$` };
  return [];
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

  return [...baseIds, ...extraIds];
}

async function handlerEvolutionMethod(methods) {
  const pokemonsWithMethod = await data.db.collection('pokemon').aggregate([
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

async function handlerIsSplit() {
  const splitPokemons = await data.db.collection('pokemon').aggregate([
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

async function handlerHasSplit() {
  const splitPokemons = await data.db.collection('pokemon').aggregate([
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

async function handlerOtherForms(others, filter) {
  filter.other_forms = { $exists: true, $ne: [] };
  filter.is_default = others == 1 ? true : false;
}

async function handlerRelationTo(typeId, expression) {
  
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

  const results = await data.db.collection("pokemon").aggregate(pipeline).toArray();

  const ids = results.map(p => p.id);
  
  return ids;
}

async function handlerEvolutionChain(form) {
  
  if (form == "first") return await handlerFirstInChain();

  else if(form == "middle") return await handlerMiddleInChain();

  else if(form == "final") return await handlerFinalInChain();
}

async function handlerFirstInChain() {
  const pipeline = [
    {
      $match: {
        evolution_step: { $ne: null }
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
    { $project: { _id: 0, id: "$pokemons.id" } }
  ];

  const result = await data.db.collection("pokemon").aggregate(pipeline).toArray();

  return result.map(p => p.id);
}

async function handlerMiddleInChain() {
  const pipeline = [
    {
      $match: {
        evolution_step: { $ne: null }
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
    { $project: { _id: 0, id: "$pokemons.id" } }
  ];

  const result = await data.db.collection("pokemon").aggregate(pipeline).toArray();
  return result.map(p => p.id);
}

async function handlerFinalInChain() {
  const pipeline = [
    {
      $match: {
        evolution_step: { $ne: null }
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
    }
  ];

  const result = await data.db.collection("pokemon").aggregate(pipeline).toArray();
  return result.map(p => p.id);
}

async function handlerDualTypes(dual, filter){
  
  if (filter.types === undefined) {

    filter.types = { $size: dual };

  }
  else {
    filter = {
      $and: [
        filter,
        { types: { $size: dual } }
      ]
    };

    return filter;
  }
}
