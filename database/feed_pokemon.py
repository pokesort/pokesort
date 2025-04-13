import database as db
import requests, json, os

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

HISUIAN = [
    899, 900, 901, 902, 903, 904, 905
]

def request_moves():
    url = "https://pokeapi.co/api/v2/pokemon?limit=15"
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

    for pokemon in data:
        pokemon_json = requests.get(pokemon['url']).json()
        species_json = requests.get(pokemon_json['species']['url']).json()

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
            "abilities": getAbilities(pokemon_json),
            "other_forms": getOtherForms(species_json, pokemon_json["id"]),
            "habitat": getHabitat(species_json),
            "shape": species_json["shape"]["name"],
            "color": getColor(species_json, pokemon_json["id"])
        }

        existing_document = pokemons.find_one({'id': document['id']})

        if existing_document:
            print(f"Documento com nome {document["name"]} já existe. Não inserindo novamente.")
        else:
            pokemons.insert_one(document)
            print(f"Documento inserido com o nome: {document["name"]}")

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

def getAbilities (pokemon_json):
    abilities = []

    for ability in pokemon_json["abilities"]:
        abilities.append(ability["ability"]["url"].split('/')[-2])

    return abilities

def getOtherForms (species_json, id):
    forms = []

    for form in species_json["varieties"]:
        new_form = form["pokemon"]["url"].split('/')[-2]

        if new_form != str(id):
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

def getColor (species_json, id):
    color = species_json["color"]["name"]

    # Falta tratamento das fromas alternativas

    return color

def getGeneration (pokemon_json, species_json):
    generation = species_json["generation"]["url"].split('/')[-2]

    # Checar se está correto

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

    # Obter categorias a partir das informações da API

    return categories

def init():
    request_moves()