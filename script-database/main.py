import feed_types as typesDB
import feed_moves as movesDB
import feed_abilities as abilityDB
import feed_evolution_chain as evolutionChainDB
import feed_evolution_methods as evolutionMethodDB
from dotenv import load_dotenv
import os

if __name__ == "__main__":
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

    # typesDB.init()
    # movesDB.init()
    # abilityDB.init()
    # evolutionMethodDB.init()
    evolutionChainDB.init()
