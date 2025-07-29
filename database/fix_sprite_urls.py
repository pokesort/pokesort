import database as db
import requests, json, os
import pandas as pd

NEEDLE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/"

def fix_sprite_urls():
    pokemons = db.connect("pokemon")
    if pokemons == None:
        print("Erro de fetch")
        return
    
    docs = pokemons.find()
    for pokemon in docs:
        if NEEDLE in pokemon["sprite_default"]:
            pokemon["sprite_default"] = pokemon["sprite_default"].replace(NEEDLE, "")
            pokemon["sprite_shiny"] = pokemon["sprite_shiny"].replace(NEEDLE, "")
            if "cry" in pokemon:
                del pokemon["cry"]

            pokemons.replace_one({"_id": pokemon["_id"]}, pokemon)
            print(f"Fixed {pokemon["name"]}")

def init():
    fix_sprite_urls()