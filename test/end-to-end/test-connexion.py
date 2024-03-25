from interface import Interface

from database import Database # type: ignore 

from random import choice
from string import ascii_uppercase, digits


DATABASE = Database("database/serverDatabase.db")

def random_string(length):
    return "".join(choice(ascii_uppercase + digits) for _ in range(length))

def add_user(username, password, email):
    DATABASE.execute("INSERT INTO player (username, password, email, identifier) VALUES (`" + username + "`, `" + password + "`, `" + email + "`, `" + random_string(64) + "`)")
    DATABASE.commit()
    
def remove_user(username):
    DATABASE.execute("DELETE FROM player WHERE username = `" + username + "`")
    DATABASE.commit()

def test_connection():
    already_exists = False
    try:
        add_user("Antoine", "Ru4ETRL2okiIimlWL6zrWbmozCX6XS2aLvHCca3WZHYfCHxI5MQnxLI7ZsG5nLch", "toine34.34@gmail.com")
    except: # the user already exists
        already_exists = True
    with Interface() as player:
        player.connect("Antoine", "Antoine2")
        assert player.is_connected()
    
    if not already_exists:
        remove_user("Antoine")
    

def test_disconnection():
    already_exists = False
    try:
        add_user("antoine", "Ru4ETRL2okiIimlWL6zrWbmozCX6XS2aLvHCca3WZHYfCHxI5MQnxLI7ZsG5nLch", "toine34.34@gmail.com")
    except: # the user already exists
        already_exists = True
    with Interface() as player:
        player.connect("Antoine", "Antoine2")
        player.disconnect()
        assert not player.is_connected()
    
    if not already_exists:
        remove_user("Antoine")
        
        
def main():
    result = []
    tests = [test_connection, test_disconnection]
    for test in tests:
        try:
            test()
            result.append(True)
        except:
            result.append(False)
    print("Test passed :", result.count(True), "/", len(result))
    if result.count(True) != len(result):
        print("Failed tests :", [tests[i].__name__ for i in range(len(result)) if not result[i]])
        return 1
    return 0

if __name__ == "__main__":
    exit(main())