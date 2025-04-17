import database as db
import requests, json, os
import pandas as pd

REGIONS = {
        '1': "kanto",
        '2': "johto",
        '3': "hoenn",
        '4': "sinnoh",
        '5': "unova",
        '6': "kalos",
        '7': "alola",
        '8': "galar",
        '9': "paldea",
    }

GENERATIONS = {
    'primal': '6',
    'mega': '6',
    'alola': '7',
    'gmax': '8',
    'galar': '8',
    'hisui': '8',
    'origin': '8',
    'paldea': '9'
}

ABILITIES = {
    744 : 20,
    658 : 210,
    718 : 211
}

HISUIAN = [
    899, 900, 901, 902, 903, 904, 905
]

POKEMON_EXCLUDES = [
    'power-construct', 'battle-bond', 'gulping', 'gorging', '-rock-star', '-pop-star', '-phd', '-belle', '-libre', '-cosplay', '-cap', '-starter',
    '-dada', '-totem', '-mode', '-build', 'own-tempo'
]

def request_moves():
    url = "https://pokeapi.co/api/v2/pokemon?limit=3000"
    response = requests.get(url)

    if response.status_code != 200:
        print("Erro de fetch")
        return
    data = response.json()['results']

    pokemons = db.connect("pokemon")
    if pokemons == None:
        print("Erro de fetch")
        return
    
    evolution_steps = db.connect("evolution_steps")
    if evolution_steps == None:
        print("Erro de fetch")
        return
    
    colors = pd.read_csv('data/colors.csv')

    add_meteor = False

    for pokemon in data:

        pokemon_json = requests.get(pokemon['url']).json()
        species_json = requests.get(pokemon_json['species']['url']).json()
        
        if 'meteor' in pokemon_json["name"] and not add_meteor:
            pokemon_json['name'] = 'minior-meteor'
            add_meteor = True
        
        if any(pk_excludes in pokemon_json['name'] for pk_excludes in POKEMON_EXCLUDES): continue

        document = {
            "id": pokemon_json["id"],
            "is_default": pokemon_json["is_default"],
            "name": pokemon_json["name"],
            "types": getTypes(pokemon_json),
            "moves": getMoves(pokemon_json),
            "egg_groups": getEggGroups(species_json),
            "evolution_step": getEvolutionStep(pokemon_json["id"], evolution_steps),
            "categories": getCategories(pokemon_json, species_json),
            "generation": getGeneration(pokemon_json, species_json),
            "region": getRegion(pokemon_json, species_json),
            "abilities": getAbilities(pokemon_json, species_json['id']),
            "other_forms": getOtherForms(species_json, pokemon_json["id"]),
            "habitat": getHabitat(species_json),
            "shape": species_json["shape"]["name"],
            "color": getColor(species_json['color']['name'], pokemon_json["name"], colors)
        }

        # existing_document = pokemons.find_one({'id': document['id']})

        # if existing_document:
        #     print(f"Documento com nome {document["name"]} já existe. Não inserindo novamente.")
        # else:
        #     pokemons.insert_one(document)
        #     print(f"Documento inserido com o nome: {document["name"]}")

def getTypes (pokemon_json):
    types = []

    for type in pokemon_json["types"]:
        types.append(type["type"]["url"].split('/')[-2])

    return types

def getMoves (pokemon_json):
    moves = []

    for move in pokemon_json["moves"]:
        moves.append(move["move"]["url"].split('/')[-2])

    return moves

def getAbilities (pokemon_json, species_id):
    abilities = []

    for ability in pokemon_json["abilities"]:
        abilities.append(ability["ability"]["url"].split('/')[-2])
    
    if species_id in ABILITIES.keys():
        abilities.append(ABILITIES[species_id])

    return abilities

def getOtherForms (species_json, id):
    forms = []

    for form in species_json["varieties"]:
        new_form = form["pokemon"]["url"].split('/')[-2]

        if new_form != str(id) and any(pk_excludes not in form['pokemon']['name'] for pk_excludes in POKEMON_EXCLUDES):
            forms.append(new_form)

    return forms

def getEggGroups (species_json):
    groups = []

    for group in species_json["egg_groups"]:
        groups.append(group["name"])

    return groups

def getHabitat (species_json):
    habitat = species_json["habitat"]

    return habitat["name"] if habitat != None else ""

def getEvolutionStep (id, evolution_steps):
    document = evolution_steps.find_one({'pokemon': id})
    
    return document["id"]

def getColor (color_api, name, colors):

    color = colors.loc[colors['Pokemon'] == name, 'Color']
    if color.empty:
        return color_api
    else:
        return color.values[0]

def getGeneration (pokemon_json, species_json):
    generation = species_json["generation"]["url"].split('/')[-2]
    
    affix = pokemon_json["name"].split('-')[-1]
    if (affix in GENERATIONS.keys() and 'giratina' not in pokemon_json['name']):
        generation = GENERATIONS[affix]

    return generation

def getRegion (pokemon_json, species_json):
    generation = species_json["generation"]["url"].split('/')[-2]
    region = REGIONS[generation]

    affix = pokemon_json["name"].split('-')[-1]
    if (affix in REGIONS.values()):
        region = affix

    if (species_json["id"] in HISUIAN):
        region = "hisui"

    return region

def getCategories (pokemon_json, species_json):
    categories = []

    # "isBaby",
    # "isMythical",
    # "isLegendary",
    # "MegaEvolves",
    # "isMegaEvolution",
    # "hasGigantamax",
    # "hasExclusiveZMove",
    # "isRegionalForm",
    # "SwitchableForm",
    # "hasGenderDifferences",
    # "isFirstPartner",
    # "isUltraBeast",
    # "isParadox"

    

    # Obter categorias a partir das informações da API

    return categories

def init():
    request_moves()