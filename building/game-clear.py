from config import Config
import os

PARENT_FOLDER = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

GAME_SOURCES_FOLDER = PARENT_FOLDER + "/game"

# return a list of files in a directory
def scan(path):
    return os.listdir(path)

# delete a game from the games_dir directory
def deleteGame(game, gamedir):
    if os.path.exists(gamedir+'/'+game+'.game'):
        os.remove(gamedir+'/'+game+'.game')
        print("Game '%s' removed" % game)

# delete all games from the games_dir directory
def deleteAll(gamedir):
    for game in scan(gamedir):
        deleteGame('.'.join(game.split('.')[:-1]), gamedir)

# delete all games from the games_dir directory that are not in the game_sources directory
def main(gamedir):
    games = {'.'.join(i.split('.')[:-1]): gamedir+'/'+i for i in scan(gamedir)}
    sources = scan(GAME_SOURCES_FOLDER)
    for game, path in games.items():
        if game not in sources:
            os.remove(path)
            print("Game '%s' removed" % game)


if __name__ == "__main__":
    import sys
    
    config = Config(PARENT_FOLDER+"/server.config")
    gamedir = config['games_dir']
    if not os.path.exists(gamedir):
        print("Games directory not found, no games to remove.")
        sys.exit(0)
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "--game" or sys.argv[1] == "-g":
            if len(sys.argv) < 3:
                print("Usage: python game-clear.py --game <game_name> | --all")
                sys.exit(1)
            game = sys.argv[2]
            deleteGame(game, gamedir)
            sys.exit(0)
        elif sys.argv[1] == "--all" or sys.argv[1] == "-a":
            deleteAll(gamedir)
            print("All games removed")
            sys.exit(0)
        else:
            print("Usage: python game-clear.py --game <game_name> | --all")
            sys.exit(1)
    else:
        main(gamedir)
        sys.exit(0)