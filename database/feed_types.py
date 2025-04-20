import database as db
import requests, json, os

def update_relation(list_types, mathup_dict, multiplier):
    for type in list_types:
        index = type['url'].split('/')[-2]
        mathup_dict[index] = multiplier
    
    return mathup_dict

def get_types(data):

    types_dict = {}
    index = 1
    for _ in data['results']:
        types_dict[str(index)] = 1
        index -=-1

    types_dict.pop('19')
    types_dict.pop('20')
    
    return types_dict

def request_types():
    url = "https://pokeapi.co/api/v2/type"
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()

        types = db.connect("types")

        if types != None:
            types_dict = get_types(data)
        
        for index in types_dict:
            matchups = types_dict.copy()
            url_type = "https://pokeapi.co/api/v2/type/" + str(index)
            type_json = requests.get(url_type).json()

            name = type_json['name']
            relations = type_json['damage_relations']

            matchups = update_relation(relations['double_damage_from'], matchups, 2)
            matchups = update_relation(relations['half_damage_from'], matchups, 0.5)
            matchups = update_relation(relations['no_damage_from'], matchups, 0)

            document = {
                'id': index,
                'name' : name,
                'matchups': matchups
            }

            existing_document = types.find_one({"id": index})

            if existing_document:
                print(f"Documento com nome {name} já existe. Não inserindo novamente.")
            else:
                types.insert_one(document)
                print(f"Documento inserido com o nome: {name}")

        # with open("types.json", "w") as f:
        #     json.dump(data, f, indent=4)
        
        # print("Dados salvos no arquivo types.json")
    else:
        print(f"Erro ao acessar a API: {response.status_code}")

def init():
    request_types()