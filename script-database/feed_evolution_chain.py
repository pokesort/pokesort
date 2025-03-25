import database as db
import requests, json

def request_chains():
    url = "https://pokeapi.co/api/v2/evolution-chain?limit=1"
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()['results']

        # evolution_chain = db.connect("evolution_chain")
        # evolution_step = db.connect("evolution_step")

        # if evolution_chain != None and evolution_step != None:
        for chain in data:
            
            url_chain = chain['url']
            chain_json = requests.get(url_chain).json()
            chain_json['chain']['evolution_details']
                # existing_document = abilities.find_one({'id': document['id']})

                # if existing_document:
                #     print(f"Documento com nome {name} já existe. Não inserindo novamente.")
                # else:
                #     abilities.insert_one(document)
                #     print(f"Documento inserido com o nome: {name}")

        # with open("data_chains.json", "w") as f:
        #     json.dump(data, f, indent=4)
        
        # print("Dados salvos no arquivo data_chains.json")

def init():
    request_chains()