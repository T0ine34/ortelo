from interface import Interface, Reversi

def test():
    with Interface() as player1, Interface() as player2:
        player1.connect_or_register("Antoine", "Antoine2", "a@example.com")
        player2.connect_or_register("Toto", "Toto2#", "b@example.com") # password : Toto2#

        url = player1.start_game("reversi")
        player2.join_game(url)
        
        reversi1 = Reversi(player1.getGamesContainer())
        reversi2 = Reversi(player2.getGamesContainer())
        
        hasP1won = Reversi.playRandomGame(reversi1, reversi2)
        print("Winner detected is :", "player1" if hasP1won else "player2")
        
        grid1 = reversi1.getGrid()
        grid2 = reversi2.getGrid()
        
        if grid1 == grid2:
            print("Grids are equal")
        else:
            raise Exception("Grids are different")
        
        nbBlackCases = Reversi.countColor(grid1, "black")
        nbWhiteCases = Reversi.countColor(grid1, "white")
        
        print("Black cases :", nbBlackCases)
        print("White cases :", nbWhiteCases)
        
        if nbBlackCases + nbWhiteCases == 64:
            print("Grid is full")
        elif nbBlackCases == 0:
            print("Grid is full of white cases")
        elif nbWhiteCases == 0:
            print("Grid is full of black cases")
        else:
            raise Exception("Grid is not full and does not contain only one color")
        
        realWinner = "black" if nbBlackCases > nbWhiteCases else "white"
        realWinner = "player1" if reversi1.color == realWinner else "player2"
        print("Real winner is :", realWinner)
        
        if realWinner == "player1" and hasP1won or realWinner == "player2" and not hasP1won:
            print("Winners are consistent")
        else:
            raise Exception("Winners are not consistent")
try:
    test()
    print("Test passed")
    exit(0)
except Exception as e:
    print("Test failed :", e)
    exit(1)
