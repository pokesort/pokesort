import { connect, data } from '@/lib/mongodb';
import mongoose from 'mongoose';

export const populate = async (res, existingPuzzle) => {
  await connect();
  let dictionary = {pokemons: [], moves: {}, abilities: {}, tips: []};
  const pokemonsMap = {};

  await Promise.all(
    existingPuzzle.groups.map(async (group) => {
      let mons = await data.db.collection('pokemon').find({ id: { $in: group.pokemons }}, { projection: { name: 1, id: 1, species_name: 1, dex_number: 1, sprite_default: 1, sprite_shiny: 1, cry: 1, _id: 0 } }).toArray();
      mons.forEach(m => {
        pokemonsMap[m.id] = m.name;
      })
      dictionary['pokemons'].push(mons);
      dictionary['tips'].push(populateTips(group.tips, pokemonsMap, group.query))
      
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
  dictionary.tips = dictionary.tips.flat();

  return res.status(200).json({success: true, data: existingPuzzle, dictionary: dictionary})
}

const populateTips = (tips, pokemonsMap, query) => {
  const result = [];

  if (!tips) return result;

  for (let i = 0; i < tips.length; i++) {
    const tipObject = {group: query};
    const split = tips[i].split('?');

    if (split[0] != 'pair') {
      tipObject['tip'] = tips[i];
    } else {
      let string = `${split[0]}?`
      split[1].split(',').forEach(m => {
        string += `${pokemonsMap[m]},`;
      })
      tipObject['tip'] = string.slice(0, -1);
    }

    result.push(tipObject);
  }

  return result;
}