from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import os

def connect(collection_name):
    print('Connecting to MongoDB...')
    uri = os.getenv('MONGODB_URI')
    db_name = os.getenv('DB_NAME')

    client = MongoClient(uri, server_api=ServerApi('1'))
    try:
        database = client[db_name]
        collection = database[collection_name]

        print("Retrieved collection '{collection_name}' successfully")
        return collection

    except Exception as e:
        print(e)