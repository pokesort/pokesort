import feed_categories as categoriesDB
import feed_types as typesDB
import feed_moves as movesDB
import feed_abilities as abilityDB
import feed_evolution_chain as evolutionChainDB
import feed_evolution_methods as evolutionMethodDB
import feed_pokemon as pokemon
from dotenv import load_dotenv
import os

if __name__ == "__main__":
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

    # typesDB.init()
    # movesDB.init()
    # abilitiesDbB.init()
    # categoriesDB.init()
    # abilityDB.init()
    # evolutionMethodDB.init()
    # evolutionChainDB.init()
    pokemon.init()
