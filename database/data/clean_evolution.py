'''
EVOLUTION CHAIN CLEANUP

Este script irá gerar um csv de pokemon_evolution
remanejado de forma a incluir formas regionais e chain_ids

1- Adicionar species ausentes
2- Adicionar chain_Id
3- adicionar pokemon ausentes
    3.1- tratar megas e gmax - não adicionar
    3.2- tratar forma alternativa - copiar a linha do original
    3.3- tratar formas regionais
        3.3a- forma única, evolução regional (caso raichu) - duplicar linha original
        3.3b- forma regional, evolução regional (caso meowth) - duplicar linhas originais
        3.3c- forma regional, evolução mon movo (caso wooper) - duplicar apenas mon original
    3.4- tratar lycanroc - designar uma forma para cada evolução por tempo do dia
    
'''

import pandas as pd

evolution_csv = pd.read_csv("reference/pokemon_evolution.csv")
species_csv = pd.read_csv("reference/pokemon_species.csv")
pokemon_csv = pd.read_csv("reference/pokemon.csv")

if "evolution_chain_id" not in evolution_csv.columns:
    evolution_csv["evolution_chain_id"] = None

for i, species_row in species_csv.iterrows():
    species_id = species_row["id"]
    chain_id = species_row["evolution_chain_id"]

    if not (evolution_csv["evolved_species_id"] == species_id).any():
        new_row = {"evolved_species_id": species_id, "evolution_chain_id": chain_id}
        evolution_csv = pd.concat([evolution_csv, pd.DataFrame([new_row])], ignore_index=True)

    evolution_csv.loc[evolution_csv["evolved_species_id"] == species_id, "evolution_chain_id"] = chain_id
    evolution_csv.loc[evolution_csv["evolved_species_id"] == species_id, "id"] = species_id

evolution_csv = evolution_csv.sort_values(by="id", ascending=True)



evolution_csv.to_csv("pokemon_evolution_reorder.csv", index=False)