import database as db
import requests, json

def request_abilities():
    url = "https://pokeapi.co/api/v2/ability?limit=307"
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()['results']

        abilities = db.connect("abilities")
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

        # with open("data_abilities.json", "w") as f:
        #     json.dump(data, f, indent=4)
        
        # print("Dados salvos no arquivo data_abilities.json")

def init():
    request_abilities()