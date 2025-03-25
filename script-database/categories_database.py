from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import requests
import json

def connect_mongo():
    uri = "mongodb+srv://pokesort:yiHocwX695ZaPEit@pokesortcluster.k83vm.mongodb.net/?retryWrites=true&w=majority&appName=PokesortCluster"

    client = MongoClient(uri, server_api=ServerApi('1'))
    try:
        database = client['pokesort-test']
        categories = database['categories']

        return categories

    except Exception as e:
        print(e)

def fill_categories():
    categories = connect_mongo()

    if categories != None:
        possibilities = [
            "isBaby",
            "isMythical",
            "isLegendary",
            "MegaEvolves",
            "hasGigantamax",
            "hasExclusiveZMove",
            "isRegionalForm",
            "SwitchableForm",
            "hasGenderDifferences",
            "isFirstPartner"
        ]

        index = 1

        for possibility in possibilities:

            document = {
                "id": str(index),
                "name": possibility
            }
            index -=-1

            existing_document = categories.find_one({'id': document['id']})

            if existing_document:
                print(f"Documento com nome {possibility} já existe. Não inserindo novamente.")
            else:
                categories.insert_one(document)
                print(f"Documento inserido com o nome: {possibility}")

def init():
    fill_categories()