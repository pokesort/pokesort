import database as db
import requests, json, os

def request_moves():
    url = "https://pokeapi.co/api/v2/move?limit=919"
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()['results']

        moves = db.connect("moves")
        
        if moves != None:
            for move in data:

                url_move = move['url']
                move_json = requests.get(url_move).json()

                id = move_json['id']
                name = move_json['name']
                type_id = move_json['type']['url'].split('/')[-2]

                document = {
                    'id': str(id),
                    'name': name,
                    'type_id': type_id
                }

                existing_document = moves.find_one({'id': document['id']})

                if existing_document:
                    print(f"Documento com nome {name} já existe. Não inserindo novamente.")
                else:
                    moves.insert_one(document)
                    print(f"Documento inserido com o nome: {name}")

        # with open("data_moves.json", "w") as f:
        #     json.dump(data, f, indent=4)
        
        # print("Dados salvos no arquivo data_moves.json")

def init():
    request_moves()