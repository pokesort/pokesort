import database as db
import requests, json, os

def generate_methods():
    methods = db.connect("evolution_methods")

    method_names = {
        "LEVEL UP": 0,
        "TRADE": 0,
        "USE ITEM": 0,
        "GENDER": 0,
        "UNIQUE": 0,
        "HOLD ITEM": 1,
        "KNOW MOVE": 1,
        "HAPPINESS": 2,
        "DURING DAY": 2,
        "DURING NIGHT": 2
    }

    index = 1
    for name, priority in method_names.items():
        document = {
            'id': index,
            'name' : name,
            'priority': priority
        }

        existing_document = methods.find_one({"id": index})

        if existing_document:
            print(f"Documento com nome {name} já existe. Não inserindo novamente.")
        else:
            methods.insert_one(document)
            print(f"Documento inserido com o nome: {name}")
        index -=-1

    # with open("data_evolution_methods.json", "w") as f:
    #     json.dump(data, f, indent=4)
    
    # print("Dados salvos no arquivo data_evolution_methods.json")
def init():
    generate_methods()