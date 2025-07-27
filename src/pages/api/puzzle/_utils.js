import { connect, data } from '@/lib/mongodb';
import mongoose from 'mongoose';

export const populate = async (res, existingPuzzle) => {
  await connect();
  let dictionary = {pokemons: [], moves: {}, abilities: {}};

  await Promise.all(
    existingPuzzle.groups.map(async (group) => {
      dictionary['pokemons'].push(await data.db.collection('pokemon').find({ id: { $in: group.pokemons }}, { projection: { name: 1, id: 1, species_name: 1, dex_number: 1, sprite_default: 1, sprite_shiny: 1, cry: 1, _id: 0 } }).toArray());
      
      const queryParams = group.query.slice(1).split('&');
      for (const q of queryParams) {
        if (q.includes('abilities') || q.includes('moves')) {
          let [collection, id] = q.split("=");

          try {
            const response = await data.db.collection(collection).findOne({ id: id });
            if (response) {
              dictionary[collection][id] = response.name;
            }
          } catch (err) {
            console.error(`Error fetching ${collection} with id ${id}:`, err);
          }
        }
      }
    })
  );
  dictionary.pokemons = dictionary.pokemons.flat();

  return res.status(200).json({success: true, data: existingPuzzle, dictionary: dictionary})
}