import { connect, data } from "@/lib/mongodb";

export default async function handler(req, res) {
  try {
    await connect();

    const { dex } = req.query;

    const pokemon = await getDexData(dex);

    // const pokemon = await data.db.collection("pokemon").findOne({$or:[{"id": Number(dex)}, {"name": dex}]});

    // if (!pokemon){
    //     res.status(404).json({success: false, error: "Pokemon não encontrado"})
    // }
    res.status(200).json({ success: true, pokemon: pokemon });
  } catch (error) {
    console.error("Connection failed:", error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
  }

  async function getDexData(id_dex) {
    const pokemon = await data.db
      .collection("pokemon")
      .aggregate([
        {
          $match: {
            $or: [{ id: Number(id_dex) }, { name: id_dex }],
          },
        },

        {
          $lookup: {
            from: "types",
            localField: "types",
            foreignField: "id",
            as: "typesData",
          },
        },
        {
          $addFields: {
            types: { $map: { input: "$typesData", as: "t", in: "$$t.name" } },
          },
        },

        {
          $lookup: {
            from: "moves",
            localField: "moves",
            foreignField: "id",
            as: "movesData",
          },
        },
        {
          $addFields: {
            moves: { $map: { input: "$movesData", as: "m", in: {name: "$$m.name", type: "$$m.type_id"} } },
          },
        },

        {
          $lookup: {
            from: "abilities",
            localField: "abilities",
            foreignField: "id",
            as: "abilitiesData",
          },
        },
        {
          $addFields: {
            abilities: {
              $map: { input: "$abilitiesData", as: "a", in: "$$a.name" },
            },
          },
        },

        {
          $lookup: {
            from: "categories",
            localField: "categories",
            foreignField: "id",
            as: "categoriesData",
          },
        },
        {
          $addFields: {
            categories: {
              $map: { input: "$categoriesData", as: "c", in: "$$c.name" },
            },
          },
        },

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
          },
        },
        {
          $addFields: {
            other_forms: {
              $map: {
                input: "$formsData",
                as: "f",
                in: { name: "$$f.name", id: "$$f.id" },
              },
            },
          },
        },

        {
          $project: {
            _id: 0,
            id: 0,
            dex_number: 0,
            species_name: 0,
            typesData: 0,
            movesData: 0,
            abilitiesData: 0,
            eggGroupsData: 0,
            categoriesData: 0,
            formsData: 0,
            otherFormsInt: 0,
          },
        },
      ])
      .toArray();

    return pokemon;
  }
}
