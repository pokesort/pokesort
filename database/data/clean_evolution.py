'''
EVOLUTION CHAIN CLEANUP

Este script irá gerar um csv de pokemon_evolution
remanejado de forma a incluir formas regionais e chain_ids

ALGORITMO
para cada pokemon:
    se seu nome possui keywords da skip clause (megas, gmax, totem...):
        PULAR
    se 'evolves_from' for vazio (forma inicial):
        se não existe esta espécie na tabela:
            ADICIONAR apenas com sua evolution_chain
        se já existe esta espécia na tabela:
            COPIAR linha existente e substituir identifier e pokemon_id
    senão (é forma evoluída) se id > 10000:        
        se existe mais de uma linha desta espécie na tabela:
            ATUALIZAR identifier e pokemon_id na linha correta
        se existe somente uma linha desta espécie na tabela:
            COPIAR linha existente e substituir identifier e pokemon_id
    senão:
        ATUALIZAR identifier e pokemon_id
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

    column_order = evolution_csv.columns.tolist()
    column_order.insert(column_order.index("id") + 1, "pokemon_id")
    column_order.insert(column_order.index("pokemon_id") + 1, "identifier")
    column_order.insert(column_order.index("evolved_species_id") + 1, "evolution_chain_id")
    column_order.insert(column_order.index("evolution_chain_id") + 1, "is_split")
    column_order = list(dict.fromkeys(column_order))
    return evolution_csv[column_order]

def start_cleanup (pokemon_csv, evolution_csv, species_csv):
    for _, pokemon in pokemon_csv.iterrows():
        if pokemon["id"] >= 10000 and skip_clause(pokemon): continue
        print(f"> Iterando #{pokemon["id"]}: {pokemon["identifier"]}")

        species = species_csv.loc[species_csv["id"] == pokemon["species_id"]].iloc[0]
        is_split = pd.notna(species["evolves_from_species_id"]) and (species_csv["evolves_from_species_id"] == species["evolves_from_species_id"]).sum() > 1
        is_split = 1 if is_split else 0

        if pd.isna(species["evolves_from_species_id"]):
            if not (evolution_csv["evolved_species_id"] == pokemon["species_id"]).any():
                evolution_csv = add_clause(evolution_csv, pokemon, species, is_split)
            else:
                copy_clause(pokemon)
        elif pokemon["id"] >= 10000:
            if (evolution_csv["evolved_species_id"] == pokemon["species_id"]).sum() == 1:
                copy_clause(pokemon)
            else:
                update_clause(pokemon)
        else:
            update_clause(pokemon)

    return evolution_csv.sort_values(by=["evolution_chain_id", "pokemon_id"], ascending=True)

# def start_cleanup_old ():
#     # Percorre pokemons, adicionando os ausentes e os tratando
#     global pokemon_csv, evolution_csv, species_csv
#     for _, pokemon in pokemon_csv.iterrows():
#         if pokemon["id"] >= 10000 and skip_clause(pokemon): continue

#         print(f"> Iterando #{pokemon["id"]}: {pokemon["identifier"]}")
#         pokemon_id = pokemon["id"]
#         species_id = pokemon["species_id"]
#         species = species_csv.loc[species_csv["id"] == species_id].iloc[0]
#         is_split = pd.notna(species["evolves_from_species_id"]) and (species_csv["evolves_from_species_id"] == species["evolves_from_species_id"]).sum() > 1
#         is_split = 1 if is_split else 0
        
#         if pokemon["id"] < 10000 and not (evolution_csv["evolved_species_id"] == species_id).any():
#             print(f"Criando nova linha para {pokemon["identifier"]}...")
#             new_row = {"pokemon_id": pokemon_id, "evolved_species_id": species_id}
#             evolution_csv = pd.concat([evolution_csv, pd.DataFrame([new_row])], ignore_index=True)
#         else:
#             evolution_csv.loc[evolution_csv["evolved_species_id"] == pokemon_id, "pokemon_id"] = pokemon_id

#         print(f"Atualizando linha de {pokemon["identifier"]}...")
#         evolution_csv.loc[evolution_csv["pokemon_id"] == pokemon_id, "identifier"] = pokemon["identifier"]
#         evolution_csv.loc[evolution_csv["pokemon_id"] == pokemon_id, "evolved_species_id"] = species_id
#         evolution_csv.loc[evolution_csv["pokemon_id"] == pokemon_id, "evolution_chain_id"] = species["evolution_chain_id"]
#         evolution_csv.loc[evolution_csv["pokemon_id"] == pokemon_id, "is_split"] = is_split

#     evolution_csv = evolution_csv.sort_values(by=["evolution_chain_id", "pokemon_id"], ascending=True)

def skip_clause (pokemon):
    # Exclui formas mega, gmax e outras formas
    keywords = ['-mega', '-gmax', '-primal', '-totem', 'pikachu', 'eternatus', 'koraidon', 'miraidon']
    return any(keyword in pokemon["identifier"] for keyword in keywords)

def add_clause (evolution_csv, pokemon, species, is_split=0):
    print(f"Criando nova linha para {pokemon["identifier"]}...")
    new_row = {
        "pokemon_id": pokemon["id"],
        "evolved_species_id": species["id"],
        "identifier": pokemon["identifier"],
        "evolution_chain_id": species["evolution_chain_id"],
        "is_split": is_split
    }
    return pd.concat([evolution_csv, pd.DataFrame([new_row])], ignore_index=True)

def copy_clause (pokemon):
    print("Copy")

def update_clause (pokemon):
    print("Update")

if __name__ == "__main__":
    fetch_data()
    pokemon_csv = pd.read_csv("reference/pokemon.csv")
    evolution_csv = pd.read_csv("reference/pokemon_evolution.csv")
    species_csv = pd.read_csv("reference/pokemon_species.csv")

    evolution_csv = prepare_dataframe(evolution_csv)
    evolution_csv = start_cleanup(pokemon_csv, evolution_csv, species_csv)
    evolution_csv.to_csv("pokemon_evolution.csv", index=False)