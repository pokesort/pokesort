import database as db
import requests, json

def request_chains():
    url = "https://pokeapi.co/api/v2/evolution-chain?limit=20"
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()['results']

        global methods, evolution_chain, evolution_step
        methods = db.connect("evolution_methods")
        evolution_chain = db.connect("evolution_chain")
        evolution_step = db.connect("evolution_step")

        if evolution_chain is None or evolution_step is None:
            return

        for chain in data:
            
            url_chain = chain['url']
            chain_json = requests.get(url_chain).json()

            existing_document = evolution_chain.find_one({'id': chain_json['id']})
            if existing_document:
                print(f"Documento com id {chain_json['id']} já existe. Não inserindo novamente.")
                continue
            
            global chain_document
            chain_document = {
                'id': chain_json['id'],
                'steps': []
            }
            

            generate_step(chain_json['id'], chain_json['chain'])

            evolution_chain.insert_one(chain_document)
            print(f"Documento de chain inserido com o id: {chain_document['id']}")

def generate_step (chain_id, data, step=0):
    pokemon_id = data['species']['url'].split('/')[-2]    

    step_document = {
        "chain_id": chain_id,
        "step": step,
        "pokemon": pokemon_id,
        "methods": generate_methods(data)
    }
    
    inserted = evolution_step.insert_one(step_document)
    chain_document["steps"].append(inserted.inserted_id)
    print(f"Documento de step inserido com o id: {inserted.inserted_id}")
    print(step_document)

    for next in data['evolves_to']:
        generate_step(chain_id, next, step+1)

def generate_methods (data):
    methods = []

    # if (len(data['evolution_details']) < 1):


    return methods

def init():
    request_chains()