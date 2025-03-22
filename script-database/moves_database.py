from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import requests
import json

def connect_mongo():
    uri = "mongodb+srv://pokesort:yiHocwX695ZaPEit@pokesortcluster.k83vm.mongodb.net/?retryWrites=true&w=majority&appName=PokesortCluster"

    client = MongoClient(uri, server_api=ServerApi('1'))
    try:
        database = client['pokesort-test']
        moves = database['moves']

        return moves

    except Exception as e:
        print(e)

def request_moves():
    url = "https://pokeapi.co/api/v2/move?limit=919"
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()['results']

        moves = connect_mongo()
        
        if moves != None:
            for move in data:

                url_move = move['url']
                move_json = requests.get(url_move).json()

                id = url_move.split('/')[-2]
                name = move_json['name']
                type_id = move_json['type']['url'].split('/')[-2]

                document = {
                    'id': id,
                    'name': name,
                    'type_id': type_id
                }

                existing_document = moves.find_one(document['id'])

                if existing_document:
                    print(f"Documento com nome {name} já existe. Não inserindo novamente.")
                else:
                    moves.insert_one(document)
                    # print(f"Documento inserido com o nome: {name}")

        # with open("moves.json", "w") as f:
        #     json.dump(data, f, indent=4)
        
        # print("Dados salvos no arquivo moves.json")

def init():
    request_moves()