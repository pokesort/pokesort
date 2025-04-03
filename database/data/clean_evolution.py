'''
EVOLUTION CHAIN CLEANUP

Este script irá gerar um csv de pokemon_evolution
remanejado de forma a incluir formas regionais e chain_ids
'''

import pandas as pd
import os, requests

def fetch_data ():
    # Se os arquivos csv não existirem, buscá-los do github
    files = {
        "reference/pokemon.csv": "https://raw.githubusercontent.com/PokeAPI/pokeapi/refs/heads/master/data/v2/csv/pokemon.csv",
        "reference/pokemon_evolution.csv": "https://raw.githubusercontent.com/PokeAPI/pokeapi/refs/heads/master/data/v2/csv/pokemon_evolution.csv",
        "reference/pokemon_species.csv": "https://raw.githubusercontent.com/PokeAPI/pokeapi/refs/heads/master/data/v2/csv/pokemon_species.csv"
    }
    os.makedirs("reference", exist_ok=True)

    for file_path, url in files.items():
        if not os.path.exists(file_path):
            print(f"Baixado {file_path}...")
            response = requests.get(url)
            if response.status_code == 200:
                with open(file_path, "wb") as f:
                    f.write(response.content)
                print(f"> {file_path} baixado com sucesso.")
            else:
                print(f"> Falha ao baixar {file_path}. Erro {response.status_code}")
                raise RuntimeError("Error: Failed to fetch data.")

def prepare_dataframe (evolution_csv):
    # Prepara as novas colunas e as ordena
    evolution_csv["identifier"] = None
    evolution_csv["evolution_chain_id"] = None
    evolution_csv["is_split"] = None
    evolution_csv["pokemon_id"] = None
    evolution_csv["step_id"] = 0
    evolution_csv["regional"] = None

    column_order = evolution_csv.columns.tolist()
    column_order.insert(column_order.index("id") + 1, "identifier")
    column_order.insert(column_order.index("identifier") + 1, "pokemon_id")
    column_order.insert(column_order.index("pokemon_id") + 1, "step_id")
    column_order.insert(column_order.index("evolved_species_id") + 1, "evolution_chain_id")
    column_order.insert(column_order.index("evolution_chain_id") + 1, "is_split")
    column_order.insert(column_order.index("evolution_trigger_id") + 1, "regional")
    column_order = list(dict.fromkeys(column_order))
    return evolution_csv[column_order]

def start_cleanup (pokemon_csv, evolution_csv, species_csv):
    for _, pokemon in pokemon_csv.iterrows():
        # if not ('darmanitan' in pokemon["identifier"]): continue
        if pokemon["id"] >= 10000 and skip_clause(pokemon): continue
        print(f"> Iterando #{pokemon["id"]}: {pokemon["identifier"]}")

        species = species_csv.loc[species_csv["id"] == pokemon["species_id"]].iloc[0]
        is_split = pd.notna(species["evolves_from_species_id"]) and (species_csv["evolves_from_species_id"] == species["evolves_from_species_id"]).sum() > 1
        pokemon["is_split"] = 1 if is_split else 0
        pokemon["evolution_chain_id"] = species["evolution_chain_id"]

        if pd.isna(species["evolves_from_species_id"]):
            if not (evolution_csv["evolved_species_id"] == pokemon["species_id"]).any():
                evolution_csv = add_clause(evolution_csv, pokemon)
            else:
                evolution_csv = copy_clause(evolution_csv, pokemon)
        elif pokemon["id"] >= 10000 and ('-zen' in pokemon['identifier'] or (evolution_csv["evolved_species_id"] == pokemon["species_id"]).sum() == 1):
                evolution_csv = copy_clause(evolution_csv, pokemon)
        else:
            evolution_csv = update_clause(evolution_csv, pokemon)

    evolution_csv = leftover_clause(evolution_csv)
    evolution_csv = evolution_csv.sort_values(by=["evolution_chain_id", "evolved_species_id", "pokemon_id"], ascending=True).reset_index(drop=True)
    evolution_csv["id"] = range(1, len(evolution_csv) + 1)
    evolution_csv = handle_regionals(evolution_csv)
    
    print(f"> Atualizando step_ids...")
    for i in evolution_csv.loc[pd.isna(evolution_csv["evolution_trigger_id"])].index:
        pokemon = evolution_csv.iloc[i]
        evolution_csv = handle_steps(evolution_csv, species_csv, pokemon["pokemon_id"])
    evolution_csv = evolution_csv.sort_values(by=["evolution_chain_id", "step_id", "evolved_species_id", "pokemon_id"], ascending=True).reset_index(drop=True)
    evolution_csv["id"] = range(1, len(evolution_csv) + 1)    

    return evolution_csv

def skip_clause (pokemon):
    # Exclui formas mega, gmax e outras formas
    keywords = ['-mega', '-gmax', '-primal', '-totem', '-dada', 'pikachu', 'eevee', 'rockruff', 'eternatus', 'koraidon', 'miraidon']
    return any(keyword in pokemon["identifier"] for keyword in keywords)

def add_clause (evolution_csv, pokemon):
    # Adiciona um evolution step novo
    print(f"Criando nova linha para {pokemon["identifier"]}...")
    new_row = {
        "pokemon_id": pokemon["id"],
        "evolved_species_id": pokemon["species_id"],
        "identifier": pokemon["identifier"],
        "evolution_chain_id": pokemon["evolution_chain_id"],
        "is_split": pokemon["is_split"],
        "step_id": 0
    }
    return pd.concat([evolution_csv, pd.DataFrame([new_row])], ignore_index=True)

def copy_clause (evolution_csv, pokemon):
    # Copia o evolution step da forma original deste pokemon
    print(f"Copiando linha para {pokemon["identifier"]}...")
    special = '-galar-zen' in pokemon["identifier"]
    new_row = evolution_csv.loc[evolution_csv["evolved_species_id"] == pokemon["species_id"]].iloc[1 if special else 0]
    new_row["identifier"] = pokemon["identifier"]
    new_row["pokemon_id"] = pokemon["id"]
    new_row["evolution_chain_id"] = pokemon["evolution_chain_id"]
    new_row["is_split"] = pokemon["is_split"]
    return pd.concat([evolution_csv, pd.DataFrame([new_row])], ignore_index=True)

def update_clause (evolution_csv, pokemon):
    # Encontra uma linha apropriada para inserir as informações deste pokemon
    rows = evolution_csv.loc[evolution_csv["evolved_species_id"] == pokemon["species_id"]]
    if rows.empty: return evolution_csv
    print(f"Atualizando linha para {pokemon["identifier"]}...")

    update_index = rows.index[0]
    for i in rows.index:
        if pd.isna(evolution_csv.at[i, "identifier"]):
            update_index = i
            break

    evolution_csv.at[update_index, "identifier"] = pokemon["identifier"]
    evolution_csv.at[update_index, "pokemon_id"] = pokemon["id"]
    evolution_csv.at[update_index, "evolution_chain_id"] = pokemon["evolution_chain_id"]
    evolution_csv.at[update_index, "is_split"] = pokemon["is_split"]
    return evolution_csv

def leftover_clause (evolution_csv):
    # Cuida de métodos de evolução alternativos como milotic e magnezone
    rows = evolution_csv.loc[pd.isna(evolution_csv["pokemon_id"])]
    if rows.empty: return evolution_csv
    print("> Resolvendo evoluções duplicadas...")

    for i in rows.index:
        pokemon = evolution_csv.loc[evolution_csv["evolved_species_id"] == evolution_csv.at[i, "evolved_species_id"]].iloc[0]

        evolution_csv.at[i, "identifier"] = pokemon["identifier"]
        evolution_csv.at[i, "pokemon_id"] = pokemon["pokemon_id"]
        evolution_csv.at[i, "evolution_chain_id"] = pokemon["evolution_chain_id"]
        evolution_csv.at[i, "is_split"] = pokemon["is_split"]

    return evolution_csv

def handle_regionals (evolution_csv):
    # Itera novamente pelo dataset colocando formas regionais em suas próprias linhas evolutivas
    print(f"> Tratando formas regionais...")

    sufixes = ['alola', 'galar', 'hisui', 'paldea', 'white-striped', 'basculegion-male']
    regions = ['alola', 'galar', 'hisui', 'paldea']
    special_bois = {
        862: regions[1],
        863: regions[1],
        865: regions[1],
        864: regions[1],
        866: regions[1],
        867: regions[1],
        899: regions[2],
        900: regions[2],
        901: regions[2],
        902: regions[2],
        10248: regions[2],
        903: regions[2],
        904: regions[2],
        980: regions[3],
        10272: regions[3],
    }
    mime_case = [57]
    new_line = {}

    for i in evolution_csv["id"].unique():
        pokemon = evolution_csv.loc[evolution_csv['id'] == i].iloc[0]
        chain_id = pokemon["evolution_chain_id"]
        if chain_id not in new_line:
            new_line[chain_id] = chain_id in mime_case

        if any(sufix in pokemon["identifier"] for sufix in sufixes):
            print(f"Tratando {pokemon['identifier']}")
            
            sufix = 'hisui'
            for region in regions:
                if (region in pokemon["identifier"]): sufix = region

            if pd.isna(pokemon["evolution_trigger_id"]) or new_line[chain_id]:
                evolution_csv.loc[evolution_csv['id'] == pokemon["id"], "evolution_chain_id"] = f"{chain_id}-{sufix}"
                new_line[chain_id] = True
            evolution_csv.loc[evolution_csv['id'] == pokemon["id"], "regional"] = sufix
        elif pokemon["pokemon_id"] in special_bois.keys():
            print(f"Tratando {pokemon['identifier']}")

            sufix = special_bois[pokemon["pokemon_id"]]
            if new_line[chain_id]:
                evolution_csv.loc[evolution_csv['id'] == pokemon["id"], "evolution_chain_id"] = f"{chain_id}-{sufix}"
            evolution_csv.loc[evolution_csv['id'] == pokemon["id"], "regional"] = sufix

    return evolution_csv

def handle_steps (evolution_csv, species_csv, id, step=0):
    # Adiciona recursivamente o id dos steps de cada linha evolutiva
    
    evolution_csv.loc[evolution_csv["pokemon_id"] == id, "step_id"] = step
    pokemon = evolution_csv.loc[evolution_csv["pokemon_id"] == id].iloc[0]
    next_ids = species_csv.loc[species_csv["evolves_from_species_id"] == pokemon["evolved_species_id"], "id"].tolist()
    next_mons = evolution_csv.loc[
        (evolution_csv["evolved_species_id"].isin(next_ids)) & 
        (evolution_csv["evolution_chain_id"] == pokemon["evolution_chain_id"]), 
        "pokemon_id"
    ].tolist()

    # Tratar mime jr
    if (id == 439):
        next_mons.append(10168)

    for next_id in next_mons:
        evolution_csv = handle_steps(evolution_csv, species_csv, next_id, step+1)

    return evolution_csv

if __name__ == "__main__":
    fetch_data()
    pokemon_csv = pd.read_csv("reference/pokemon.csv")
    evolution_csv = pd.read_csv("reference/pokemon_evolution.csv")
    species_csv = pd.read_csv("reference/pokemon_species.csv")

    evolution_csv = prepare_dataframe(evolution_csv)
    evolution_csv = start_cleanup(pokemon_csv, evolution_csv, species_csv)
    print(f"> Salvando csv modificado com {evolution_csv.shape[0]} linhas")
    evolution_csv.to_csv("pokemon_evolution.csv", index=False)