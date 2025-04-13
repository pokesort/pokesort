import database as db
import requests, json, os

def request_moves():
    url = "https://pokeapi.co/api/v2/move?limit=919"
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()['results']

        pokemons = db.connect("pokemons")
        
        if pokemons != None:
            for pokemon in data:

                url_pokemon = pokemon['url']
                pokemon_json = requests.get(url_pokemon).json()

                # existing_document = pokemons.find_one({'id': document['id']})

                # if existing_document:
                #     print(f"Documento com nome {name} já existe. Não inserindo novamente.")
                # else:
                #     pokemons.insert_one(document)
                #     print(f"Documento inserido com o nome: {name}")

        # with open("data_pokemon.json", "w") as f:
        #     json.dump(data, f, indent=4)
        
        # print("Dados salvos no arquivo data_pokemon.json")

def init():
    request_moves()