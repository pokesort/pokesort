import database as db

def fill_categories():
    categories = db.connect("categories")

    if categories != None:
        possibilities = [
            "isBaby",
            "isMythical",
            "isLegendary",
            "MegaEvolves",
            "isMegaEvolution",
            "hasGigantamax",
            "hasExclusiveZMove",
            "hasRegionalForm",
            "SwitchableForm",
            "hasGenderDifferences",
            "isFirstPartner",
            "isUltraBeast",
            "isParadox",
            "isGMax",
            "isRegionalForm",
            "isVivillon",
            "isFossil"
        ]

        index = 1

        for possibility in possibilities:

            document = {
                "id": str(index),
                "name": possibility,
                "display": True if possibility != 'isVivillon' else False
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