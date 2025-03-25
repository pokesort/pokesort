from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import os

def connect(collection_name):
    print('Connecting to MongoDB...')
    uri = os.getenv('MONGODB_URI')

    client = MongoClient(uri, server_api=ServerApi('1'))
    try:
        database = client['pokesort-test']
        collction = database[collection_name]

        print('Connected successfully')
        return collction

    except Exception as e:
        print(e)