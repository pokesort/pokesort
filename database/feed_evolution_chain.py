import database as db
import pandas as pd
import requests

def check_unique(pokemon):

    is_unique = False
    unique_columns = [
        'relative_physical_stats',
        'party_species_id',
        'party_type_id',
        'trade_species_id',
        'needs_overworld_rain',
        'turn_upside_down'
    ]
    for col in unique_columns:
        is_unique = is_unique or not (pd.isna(pokemon[col]) or pokemon[col] == 0)

    is_unique = is_unique or pokemon["time_of_day"] == "dusk"

    return is_unique

def fill_methods(pokemon):

    methods = []

    if pd.isna(pokemon['evolution_trigger_id']):
        return methods
    if pokemon['evolution_trigger_id'] == 1.0:
        methods.append(1)
    if pokemon['evolution_trigger_id'] == 2.0:
        methods.append(2)
    if pokemon['evolution_trigger_id'] == 3.0:
        methods.append(4)
    if pokemon['evolution_trigger_id'] > 3.0:
        methods.append(3)
    if not pd.isna(pokemon['regional']):
        methods.append(3)
    if pokemon['evolution_trigger_id'] != 3 and not pd.isna(pokemon['trigger_item_id']):
        methods.append(7)
    if not pd.isna(pokemon['gender_id']):
        methods.append(5)
    if not pd.isna(pokemon['known_move_id']) or not pd.isna(pokemon['known_move_type_id']):
        methods.append(8)
    if not pd.isna(pokemon['minimum_happiness']):
        methods.append(9)
    if pokemon['time_of_day'] == 'day':
        methods.append(10)
    if pokemon['time_of_day'] == 'night':
        methods.append(11)
    if 3 not in methods and check_unique(pokemon):
        methods.append(3)

    return list(set(methods))

def generate_chains():

    pokemon_csv = pd.read_csv("data/pokemon_evolution.csv")

    steps = db.connect("evolution_steps")
    chains = db.connect("evolution_chains")
    steps_dict = {}

    for _, pokemon in pokemon_csv.iloc[:101].iterrows():

        chain_id = pokemon["evolution_chain_id"]
        if chain_id not in steps_dict:
            steps_dict[chain_id] = []
        methods = fill_methods(pokemon)

        id = f"{pokemon['evolution_chain_id']}-{pokemon['step_id']}"
        document = {
            'id': id,
            'step' : pokemon['step_id'],
            'is_split': pokemon['is_split'],
            'pokemon': pokemon['pokemon_id'],
            'methods': methods
        }

        print(document)

        existing_document = steps.find_one({"id": id, "pokemon": pokemon['pokemon_id']})

        if existing_document:
            steps_dict[chain_id].append(existing_document["_id"])
            print(f"Evolution step com id {id} já existe. Não inserindo novamente.")
        else:
            result = steps.insert_one(document)
            steps_dict[chain_id].append(result.inserted_id)
            print(f"Evolution step inseridi com o id: {id}")

    for chain_id, steps in steps_dict.items():
        document = {
            'id': chain_id,
            'steps': steps
        }

        existing_document = chains.find_one({"id": chain_id})

        if existing_document:
            print(f"Evolution chain com id {chain_id} já existe. Não inserindo novamente.")
        else:
            chains.insert_one(document)
            print(f"Evolution chain inserido com o id: {chain_id}")
    
def init():
    generate_chains()