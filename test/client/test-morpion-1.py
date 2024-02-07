from interface import Interface, Morpion

with Interface() as player1, Interface() as player2:
    player1.connect_or_register("antoine", "antoine", "antoine.buirey@gmail.com")
    player2.connect_or_register("toto", "toto", "antoine.buirey@gmail.com")
    
    url = player1.start_game("morpion")
    player2.join_game(url)
    
    morpion1 = Morpion(player1.getGamesContainer())
    morpion2 = Morpion(player2.getGamesContainer())
    
    print("Testing Morpion game with " + str(len(Morpion.Scenario)) + " scenarios")
    result = []
    for i in range(len(Morpion.Scenario)):
        print("Scenario", i)
        print("\tExpected result :", Morpion.ExpectedResults[i])
        winner = Morpion.playScenario(morpion1, morpion2, Morpion.Scenario[i])
        print("\tWinner :", winner)
        result.append(winner == Morpion.ExpectedResults[i])
        if i < len(Morpion.Scenario) - 1:
            morpion1.restart()
            morpion2.restart()
        
print("Test passed :", result.count(True), "/", len(result))
if result.count(True) != len(result):
    print("Failed scenarios :", [i for i in range(len(result)) if not result[i]])
    exit(1)
exit(0)
