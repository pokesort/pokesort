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
    column_order.insert(column_order.index("id") + 1, "identifier")
    column_order.insert(column_order.index("identifier") + 1, "pokemon_id")
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
        pokemon["is_split"] = 1 if is_split else 0
        pokemon["evolution_chain_id"] = species["evolution_chain_id"]

        if pd.isna(species["evolves_from_species_id"]):
            if not (evolution_csv["evolved_species_id"] == pokemon["species_id"]).any():
                evolution_csv = add_clause(evolution_csv, pokemon)
            else:
                evolution_csv = copy_clause(evolution_csv, pokemon)
        elif pokemon["id"] >= 10000 and (evolution_csv["evolved_species_id"] == pokemon["species_id"]).sum() == 1:
                evolution_csv = copy_clause(evolution_csv, pokemon)
        else:
            evolution_csv = update_clause(evolution_csv, pokemon)

    evolution_csv = leftover_clause(evolution_csv)
    evolution_csv = evolution_csv.sort_values(by=["evolution_chain_id", "evolved_species_id", "pokemon_id"], ascending=True)
    evolution_csv["id"] = range(1, len(evolution_csv) + 1)
    return evolution_csv

def skip_clause (pokemon):
    # Exclui formas mega, gmax e outras formas
    keywords = ['-mega', '-gmax', '-primal', '-totem', 'pikachu', 'eternatus', 'koraidon', 'miraidon']
    return any(keyword in pokemon["identifier"] for keyword in keywords)

def add_clause (evolution_csv, pokemon):
    # Adiciona um evolution step novo
    print(f"Criando nova linha para {pokemon["identifier"]}...")
    new_row = {
        "pokemon_id": pokemon["id"],
        "evolved_species_id": pokemon["species_id"],
        "identifier": pokemon["identifier"],
        "evolution_chain_id": pokemon["evolution_chain_id"],
        "is_split": pokemon["is_split"]
    }
    return pd.concat([evolution_csv, pd.DataFrame([new_row])], ignore_index=True)

def copy_clause (evolution_csv, pokemon):
    # Copia o evolution step da forma original deste pokemon
    print(f"Copiando linha para {pokemon["identifier"]}...")
    new_row = evolution_csv.loc[evolution_csv["evolved_species_id"] == pokemon["species_id"]].iloc[0]
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

if __name__ == "__main__":
    fetch_data()
    pokemon_csv = pd.read_csv("reference/pokemon.csv")
    evolution_csv = pd.read_csv("reference/pokemon_evolution.csv")
    species_csv = pd.read_csv("reference/pokemon_species.csv")

    evolution_csv = prepare_dataframe(evolution_csv)
    evolution_csv = start_cleanup(pokemon_csv, evolution_csv, species_csv)
    print(f"> Salvando csv modificado com {evolution_csv.shape[0]} linhas")
    evolution_csv.to_csv("pokemon_evolution.csv", index=False)