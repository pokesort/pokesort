import {
    FIELD_OPTIONS,
    randomInRange,
    pickRandom,
    getRandomFieldValue,
    pickRandomMult
} from '../../../scripts/utils.js';

let idsUsed = [];

export default async function handler(req, res) {

    const amount = req.query.amount;
  
    if (amount > 30) return res.status(403).json({success: false, message: "Quantidade de puzzles pedidos maior que o permitido"});

    const randomInRange = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    const author = "admin";
    const from = "system";
    const rows = randomInRange(4, 5)
    const cols = randomInRange(4, 6)
    let groups = [];

    for (let i = 1; i <= rows; i++) {

        let group = await generateGroup(cols);
        
        groups.push(group);
    }


    // const response = await fetch(`${process.env.HOST_URL}/api/puzzle/create`, {
    //     method: "POST",
    //     headers: {
    //         "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({ /* payload se necessário */ }),
    // });

    // const result = await response.json();
    // return res.status(response.status).json(result);

    return res.status(200).json({ success: true, rows: rows, cols: cols, groups: groups });
}

export async function generateGroup(cols) {

  while (true) {
    const allFields = Object.keys(FIELD_OPTIONS);
    const numFields = randomInRange(2, 3);
    const selectedFields = pickRandom(allFields, numFields);

    const queryParts = selectedFields.map((field) => {
      const value = getRandomFieldValue(field);
      return `${field}=${value}`;
    });

    const query = queryParts.join('&');
    const response = await fetch(`http://localhost:3000/api/pokemon/get?${query}`);

    if (!response.ok) {
      throw new Error(`Erro ao buscar pokémons: ${response.statusText}`);
    }

    const { pokemons } = await response.json();
    const ids = pokemons.map(p => p.name);
    
    if (ids.length >= cols) {
      
      const selected = pickRandomMult(ids, cols);
      const hasOverlap = selected.some(id => idsUsed.includes(id));

      if (hasOverlap) continue;
      idsUsed.push(...selected);
      
      return {
        query,
        pokemons: selected
      };
    }
  }
}