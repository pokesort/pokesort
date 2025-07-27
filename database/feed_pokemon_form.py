import database as db
import requests, json, os
import pandas as pd
from feed_pokemon import *
from data.lists_pokemon import *

FORM_EXCLUDES = ['minior', 'scatterbug', 'spewpa', 'mothim', 'sinistea', 'polteageist', 'poltchageist', 'sinistea']

def request_mons():
    url = "https://pokeapi.co/api/v2/pokemon-form?limit=3000&offset=1025"
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
    
    colors = pd.read_csv('data/colors.csv')

    for pokemon in data:
        if any(exclude in pokemon['name'] for exclude in FORM_EXCLUDES):
            continue

        existing_form_document = pokemons.find_one({'name': pokemon['name']})
        if existing_form_document or any(pk_excludes in pokemon['name'] for pk_excludes in POKEMON_EXCLUDES):
            print(f"Documento com nome {pokemon["name"]} já existe. Não inserindo novamente.")
            continue

        pokemon_json = requests.get(pokemon['url']).json()
        pokemon_json['id'] = pokemon_json['id'] + 10000

        species_json = requests.get(pokemon_json['pokemon']['url'].replace('/pokemon/', '/pokemon-species/')).json()
        pokemon_document = pokemons.find_one({'id': species_json['id']})

        document = {
            "id": pokemon_json["id"],
            "is_default": pokemon_json["is_default"],
            "name": pokemon_json["name"],
            "dex_number": species_json["id"],
            "species_name": species_json['name'],
            "types": getTypes(pokemon_json),
            "moves": pokemon_document['moves'],
            "egg_groups": getEggGroups(species_json),
            "evolution_step": pokemon_document['evolution_step'],
            "categories": pokemon_document['categories'],
            "generation": getGeneration(pokemon_json, species_json),
            "region": getRegion(pokemon_json, species_json),
            "abilities": pokemon_document['abilities'],
            "other_forms": getExtraOtherForms(pokemon_document['other_forms'], pokemon_json['id'], species_json['id']),
            "habitat": pokemon_document['habitat'],
            "shape": pokemon_document['shape'],
            "color": getColor(species_json['color']['name'], pokemon_json["name"], colors),

            "sprite_default": pokemon_json["sprites"]["front_default"],
            "sprite_shiny": pokemon_json["sprites"]["front_shiny"],
            "cry": pokemon_document["cry"]
        }

        pokemons.insert_one(document)
        print(f"Documento inserido com o nome: {document["name"]}")

def getExtraOtherForms (other_forms, pokemon_id, species_id):
    other_forms.insert(0, species_id)
    other_forms.remove(pokemon_id)

    return other_forms

def init():
    request_mons()