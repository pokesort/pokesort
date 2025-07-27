import { connect, data } from "@/lib/mongodb";
import { pipe } from "framer-motion";
import { pipeline } from "stream";

export default async function handler(req, res) {
  try {
    await connect();

    const { id } = req.query;

    const pokemon = await getDexData(id);

    if (!pokemon) {
      res.status(404).json({ success: false, error: "Pokemon não encontrado" });
    }

    res.status(200).json({ success: true, pokemon: pokemon });
  } catch (error) {
    console.error("Connection failed:", error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
  }

  function matchPokemonStage(id_dex) {
    return [
      {
        $match: {
          $or: [{ id: Number(id_dex) }, { name: id_dex }],
        },
      },
    ];
  }

  function enrichWithEvolutionStep() {
    return [
      {
        $lookup: {
          from: "evolution_steps",
          localField: "evolution_step",
          foreignField: "id",
          as: "evo_data",
          pipeline: [{ $project: { _id: 0, id: 1 } }],
        },
      },
      { $unwind: "$evo_data" },
      {
        $addFields: {
          split_parts: { $split: ["$evo_data.id", "-"] },
        },
      },
      {
        $addFields: {
          chain_id: {
            $cond: {
              if: { $eq: [{ $size: "$split_parts" }, 3] },
              then: {
                $concat: [
                  { $arrayElemAt: ["$split_parts", 0] },
                  "-",
                  { $arrayElemAt: ["$split_parts", 1] },
                ],
              },
              else: { $arrayElemAt: ["$split_parts", 0] },
            },
          },
        },
      },
    ];
  }

  function getEvolutionChain() {
    return [
      {
        $lookup: {
          from: "pokemon",
          let: { chainId: "$chain_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $regexMatch: {
                    input: "$evolution_step",
                    regex: { $concat: ["^", "$$chainId", "-"] },
                  },
                },
              },
            },
          ],
          as: "chainData",
        },
      },
      {
        $addFields: {
          chain: {
            $map: {
              input: "$chainData",
              as: "cd",
              in: {
                name: "$$cd.name",
                id: "$$cd.id",
                species_name: "$$cd.species_name",
                dex_number: "$$cd.dex_number",
                evolution_step: "$$cd.evolution_step",
                step_override: { $ifNull: ["$$cd.step_override", null] },                
                sprite_default: "$$cd.sprite_default",
                sprite_shiny: "$$cd.sprite_shiny"
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: "evolution_steps",
          localField: "chain.evolution_step",
          foreignField: "id",
          as: "chain_evo_data",
          // pipeline: [{ $project: { _id: 0, id: 1, methods: 1, pokemon: 1 } }],
        },
      },
      {
        $addFields: {
          chain: {
            $map: {
              input: "$chain",
              as: "c",
              in: {
                $mergeObjects: [
                  "$$c",
                  {
                    $let: {
                      vars: {
                        matched: {
                          $filter: {
                            input: "$chain_evo_data",
                            as: "ced",
                            cond: {
                              $and: [
                                { $eq: ["$$ced.id", "$$c.evolution_step"] },
                                { $eq: ["$$ced.pokemon", "$$c.id"] },
                              ],
                            },
                          },
                        },
                      },
                      in: {
                        chain_id: { $ifNull: [{ $arrayElemAt: ["$$matched.chain_id", 0] }, null] },
                        methods: { $ifNull: [{ $arrayElemAt: ["$$matched.methods", 0] }, []] },
                        is_split: { $ifNull: [{ $arrayElemAt: ["$$matched.is_split", 0] }, 0] },
                        has_split: { $ifNull: [{ $arrayElemAt: ["$$matched.has_split", 0] }, 0] },
                        step: { $ifNull: [{ $arrayElemAt: ["$$matched.step", 0] }, null] },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      }
    ];
  }

  function enrichWithMoves() {
    return [
      {
        $lookup: {
          from: "moves",
          localField: "moves",
          foreignField: "id",
          as: "movesData",
          pipeline: [{ $project: { _id: 0, id: 1, name: 1, type_id: 1 } }],
        },
      },
      {
        $addFields: {
          moves: {
            $map: {
              input: "$movesData",
              as: "m",
              in: { name: "$$m.name", type: "$$m.type_id" },
            },
          },
        },
      },
    ];
  }

  function enrichWithAbilities() {
    return [
      {
        $lookup: {
          from: "abilities",
          localField: "abilities",
          foreignField: "id",
          as: "abilitiesData",
          pipeline: [{ $project: { _id: 0, id: 1, name: 1 } }],
        },
      },
      {
        $addFields: {
          abilities: {
            $map: { input: "$abilitiesData", as: "a", in: "$$a.name" },
          },
        },
      },
    ];
  }

  function enrichWithForms() {
    return [
      {
        $addFields: {
          otherFormsInt: {
            $map: {
              input: "$other_forms",
              as: "f",
              in: { $toInt: "$$f" },
            },
          },
        },
      },
      {
        $lookup: {
          from: "pokemon",
          localField: "otherFormsInt",
          foreignField: "id",
          as: "formsData",
          pipeline: [
            {
              $project: {
                _id: 0,
                id: 1,
                name: 1,
                species_name: 1,
                dex_number: 1,
                sprite_default: 1,
                sprite_shinyt: 1
              },
            },
          ],
        },
      },
      {
        $addFields: {
          other_forms: {
            $map: {
              input: "$formsData",
              as: "f",
              in: {
                name: "$$f.name",
                id: "$$f.id",
                species_name: "$$f.species_name",
                dex_number: "$$f.dex_number",
                sprite_default: "$$f.sprite_default",
                sprite_shiny: "$$f.sprite_shiny"
              },
            },
          },
        },
      },
    ];
  }

  function cleanupFields() {
    return [
      {
        $project: {
          _id: 0,
          movesData: 0,
          abilitiesData: 0,
          formsData: 0,
          otherFormsInt: 0,
          chain_id: 0,
          chainData: 0,
          chain_evo_data: 0,
          split_parts: 0,
          evo_data: 0,
          evolution_step: 0
        },
      },
    ];
  }

  async function hasEvolutionStep(id_dex) {
    const poke = await data.db.collection("pokemon").findOne(
      { $or: [{ id: Number(id_dex) }, { name: id_dex }] },
      { projection: { evolution_step: 1 } }
    );
    return poke?.evolution_step != null;
  }

  async function getTypeMachups(result_object) {
    let matchups = {};
    let typeIds = result_object.types;

    let types = await Promise.all(
      typeIds.map(type =>
        data.db.collection("types").findOne({ id: type })
      )
    );

    types.forEach(typeDoc => {
      let currentMatchups = typeDoc.matchups;
      for (let key in currentMatchups) {
        if (matchups[key] === undefined) {
          matchups[key] = currentMatchups[key];
        } else {
          matchups[key] *= currentMatchups[key];
        }
      }
    });

    result_object.type_matchups = matchups;
    return result_object;
  }

  // Função principal
  async function getDexData(id_dex) {

    const hasEvo = await hasEvolutionStep(id_dex);

    const pipeline = [
      ...matchPokemonStage(id_dex),
      ...(hasEvo ? enrichWithEvolutionStep() : []),
      ...(hasEvo ? getEvolutionChain() : []),
      ...enrichWithMoves(),
      ...enrichWithAbilities(),
      ...enrichWithForms(),
      ...cleanupFields(),
    ];

    const result = await data.db
      .collection("pokemon")
      .aggregate(pipeline)
      .toArray();

    const object = await getTypeMachups(result[0]);

    return object;
  }

}
