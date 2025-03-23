from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import requests
import json

def connect_mongo():
    uri = "mongodb+srv://pokesort:yiHocwX695ZaPEit@pokesortcluster.k83vm.mongodb.net/?retryWrites=true&w=majority&appName=PokesortCluster"

    client = MongoClient(uri, server_api=ServerApi('1'))
    try:
        database = client['pokesort-test']
        abilities = database['abilities']

        return abilities

    except Exception as e:
        print(e)

def request_abilities():
    url = "https://pokeapi.co/api/v2/ability?limit=307"
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()['results']

        abilities = connect_mongo()

        if abilities != None:
            for ability in data:
                url_ability = ability['url']
                ability_json = requests.get(url_ability).json()

                id = url_ability.split('/')[-2]
                name = ability_json['name']

                document = {
                    'id': str(id),
                    'name': name
                }

                existing_document = abilities.find_one({'id': document['id']})

                if existing_document:
                    print(f"Documento com nome {name} já existe. Não inserindo novamente.")
                else:
                    abilities.insert_one(document)
                    print(f"Documento inserido com o nome: {name}")

        # with open("abilities.json", "w") as f:
        #     json.dump(data, f, indent=4)
        
        # print("Dados salvos no arquivo abilities.json")

def init():
    request_abilities()