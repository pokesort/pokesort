import database as db
import requests, json, os
import pandas as pd
from data.lists_pokemon import *

def request_mons():
    url = "https://pokeapi.co/api/v2/pokemon?limit=3000"
    response = requests.get(url)

    if response.status_code != 200:
        print("Erro de fetch")
        return
    data = response.json()['results']

    pokemons = db.connect("pokemon_test")
    if pokemons == None:
        print("Erro de fetch")
        return
    
    evolution_steps = db.connect("evolution_steps")
    if evolution_steps == None:
        print("Erro de fetch")
        return
    
    extra_forms_url = "https://pokeapi.co/api/v2/pokemon-form?limit=3000&offset=1025"
    extra_forms_res = requests.get(extra_forms_url)
    if extra_forms_res.status_code == 200:
        extra_forms_data = extra_forms_res.json()['results']
    
    colors = pd.read_csv('data/colors.csv')
    hasZmoves = pd.read_csv('data/z_moves.csv')['Pokémon'].drop_duplicates().tolist()

    add_meteor = False

    for pokemon in data:

        pokemon_json = requests.get(pokemon['url']).json()

        existing_document = pokemons.find_one({'id': pokemon_json['id']})
        if existing_document: 
            print(f"Documento com nome {pokemon_json["name"]} já existe. Não inserindo novamente.")
            continue

        species_json = requests.get(pokemon_json['species']['url']).json()
        
        if any(pk_excludes in pokemon_json['name'] for pk_excludes in POKEMON_EXCLUDES): continue

        if '-meteor' in pokemon_json["name"]:
            if add_meteor == True: continue

            pokemon_json['name'] = 'minior-meteor'
            add_meteor = True

        document = {
            "id": pokemon_json["id"],
            "is_default": pokemon_json["is_default"],
            "name": pokemon_json["name"],
            "dex_number": species_json["id"],
            "species_name": species_json['name'],
            "types": getTypes(pokemon_json),
            "moves": getMoves(pokemon_json),
            "egg_groups": getEggGroups(species_json),
            "evolution_step": getEvolutionStep(pokemon_json["id"], evolution_steps, pokemon_json['name']),
            "categories": getCategories(pokemon_json, species_json, hasZmoves),
            "generation": getGeneration(pokemon_json, species_json),
            "region": getRegion(pokemon_json, species_json),
            "abilities": getAbilities(pokemon_json, species_json['id']),
            "other_forms": getOtherForms(pokemon_json['name'], species_json, pokemon_json["id"], extra_forms_data),
            "habitat": getHabitat(species_json),
            "shape": species_json["shape"]["name"],
            "color": getColor(species_json['color']['name'], pokemon_json["name"], colors),

            "sprite_default": pokemon_json["sprites"]["front_default"],
            "sprite_shiny": pokemon_json["sprites"]["front_shiny"],
            "cry": pokemon_json["cries"]["latest"]
        }

        pokemons.insert_one(document)
        print(f"Documento inserido com o nome: {document["name"]}")

def getTypes (pokemon_json):
    types = []

    for type in pokemon_json["types"]:
        types.append(type["type"]["url"].split('/')[-2])

    return types

def getMoves (pokemon_json):
    moves = []

    def isLevelUpMove (details):
        out = []

        for detail in details:
            if (detail["level_learned_at"] > 0):
                print()
                out.append(detail)

        return out

    for move in pokemon_json["moves"]:
        level_up_list = isLevelUpMove(move["version_group_details"])

        if (len(level_up_list) <= 0):
            continue
        moves.append(move["move"]["url"].split('/')[-2])

    return moves

def getAbilities (pokemon_json, species_id):
    abilities = []

    for ability in pokemon_json["abilities"]:
        abilities.append(ability["ability"]["url"].split('/')[-2])
    
    if species_id in ABILITIES.keys():
        abilities.append(ABILITIES[species_id])

    return abilities

def getOtherForms (name, species_json, id, data):
    forms = []
    form_names = [name]

    for form in species_json["varieties"]:
        new_form = form["pokemon"]["url"].split('/')[-2]

        if new_form != str(id) and all(pk_excludes not in form['pokemon']['name'] for pk_excludes in POKEMON_EXCLUDES):
            forms.append(int(new_form))
            form_names.append(form["pokemon"]["name"])

    # Fetch forms
    extra_forms = [form for form in data if ('minior' not in form['name'] and species_json['name'] in form['name'])]

    for form in extra_forms:
        if form["name"] in form_names or any(pk_excludes in form['name'] for pk_excludes in POKEMON_EXCLUDES):
            continue
        forms.append(int(form["url"].split('/')[-2]) + 10000)

    return forms

def getEggGroups (species_json):
    groups = []

    for group in species_json["egg_groups"]:
        groups.append(group["name"])

    return groups

def getHabitat (species_json):
    habitat = species_json["habitat"]

    return habitat["name"] if habitat != None else ""

def getEvolutionStep (id, evolution_steps, name):

    if id >= 10000 and any(affix in name for affix in EVOLUTION_EXCLUDES): return None
    
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
    
    for gen in GENERATIONS.keys():
        if (gen in pokemon_json["name"]):
            generation = GENERATIONS[gen]

    return int(generation)

def getRegion (pokemon_json, species_json):
    generation = species_json["generation"]["url"].split('/')[-2]
    region_name = REGIONS[generation]
    name = pokemon_json["name"]

    for region in REGIONS.values():
        if (region in name):
            region_name = region

    if (species_json["id"] in HISUIAN):
        region = "hisui"

    return region_name

def getCategories (pokemon_json, species_json, hasZmoves):
    categories = set()

    if species_json['is_baby']:
        categories.add('1')
    if species_json['is_mythical']:
        categories.add('2')
    if species_json['is_legendary']:
        categories.add('3')
    
    categories = addCategoriesAlternativeForms(categories, species_json['varieties'], pokemon_json['name']) #id 4, 6, 8
    
    if '-mega' in pokemon_json['name']:
        categories.add('5')
    
    if pokemon_json['name'] in hasZmoves:
        categories.add('7')
    if species_json['forms_switchable'] or species_json['name'] in FORMS_SWITCHABLE:
        categories.add('9')
    if species_json['has_gender_differences']:
        categories.add('10')
    if pokemon_json['name'] in STARTERS:
        categories.add('11')
    if pokemon_json['name'] in ULTRABEASTS:
        categories.add('12')
    if pokemon_json['name'] in PARADOX:
        categories.add('13')
    if '-gmax' in pokemon_json['name']:
        categories.add('14')
    if any(regional_name in pokemon_json['name'] for regional_name in REGIONAL_NAMES):
        categories.add('15')
    if species_json['name'] in FOSSIL:
        categories.add('17')

    # print(pokemon_json['name'], categories)
    return list(categories)

def addCategoriesAlternativeForms(categories, forms, name):

    for form in forms:
        if name == form['pokemon']['name'] or any(pk_excludes in form['pokemon']['name'] for pk_excludes in POKEMON_EXCLUDES): continue 

        if name + '-mega' in form['pokemon']['name']:
            categories.add('4')
        if name + '-gmax' in form['pokemon']['name'] or 'eternamax' in form['pokemon']['name']:
            categories.add('6')
        if any(regional_name in form['pokemon']['name'] for regional_name in REGIONAL_NAMES):
            categories.add('8')
    return categories

def init():
    request_mons()