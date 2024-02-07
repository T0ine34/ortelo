#install selenium
try:
    from selenium import webdriver
except ImportError:
    import install
    if install.ask_install("selenium"):
        from selenium import webdriver
    else:
        print("The program will not work without selenium.")
        exit(1)

from selenium.webdriver.common.by import By
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from time import sleep

from random import randint

class NotConnectedException(Exception):
    def __init__(self):
        super().__init__("Not connected")
        
class AlreadyConnectedException(Exception):
    def __init__(self):
        super().__init__("Already connected")

class GameNotFoundException(Exception):
    def __init__(self):
        super().__init__("Game not found")

class Morpion:
    def __init__(self, element):
        self.element = element
        gameBoard = element.find_element(By.ID, "gameBoard")
        self.grid = gameBoard.find_element(By.TAG_NAME, "tbody")
        gameStatus = element.find_element(By.ID, "gameStatus")
        self.icon = gameStatus.find_element(By.TAG_NAME, "span").text[1:-1] #this is the icon of the player who are starting the game
        if not gameStatus.text.startswith("C'est votre tour "):
            self.icon = "O" if self.icon == "X" else "X" #if the text indicates that it's not this player's turn, then it's the other player's turn, so the icon is the opposite of the one indicated in the text
        self.finished = False
    
    def get_case(self, x, y):
        return self.grid.find_elements(By.TAG_NAME, "tr")[y].find_elements(By.TAG_NAME, "td")[x]
    
    def get_winner(self):
        statusElement =  self.element.find_element(By.ID, "gameStatus")
        if statusElement.text.endswith("a gagné !"):
            winnerIcon = statusElement.find_element(By.TAG_NAME, "span").text #should return X or O
            return winnerIcon
        return None
    
    def is_finished(self):
        # the game is finished if the button with the id "restartButton" is visible
        restartButton = self.element.find_element(By.ID, "restartButton")
        self.finished = restartButton.is_displayed()
        return self.finished
    
    def IsMyTurn(self):
        gameStatus = self.element.find_element(By.ID, "gameStatus")
        return gameStatus.text.startswith("C'est votre tour ")
    
    def play(self, x, y):
        if self.finished: raise Exception("Game is finished")
        self.get_case(x, y).click()
        sleep(0.25)
        if self.is_finished():
            return self.get_winner()
        
    def restart(self):
        if not self.finished: raise Exception("Game is not finished")
        if self.element.find_element(By.ID, "restartButton").is_displayed(): #if the button is visible, then click on it, else the game is already restarted by the other player
            self.element.find_element(By.ID, "restartButton").click()
            sleep(1)
        self.finished = False
    
    Scenario = [ #contains different parties of morpion, with either a winner or not (contains actions of both players, so the first player is always X and the second is always O)
            [(2,0), (2,2), (2,1), (0,1), (0,0), (1,0), (1,2), (1,1), (0,2)], #no winner
            [(1,1), (1,0), (0,0), (1, 2), (0,1), (2,0), (0,2)], #X wins (diagonal)
            [(0,0), (0,1), (1,0), (1,1), (2,0)], #X wins (horizontal)
            [(0,0), (0,1), (1,0), (1,1), (0,2), (2,1)], # O wins (horizontal)
            [(1,1), (2,0), (0,0), (2,2), (0,2), (2,1)] # O wins (vertical)
,    ]
    
    ExpectedResults = [None, "X", "X", "O", "O"]
    
    @staticmethod
    def playScenario(morpion1, morpion2, scenario):
        if morpion1.IsMyTurn():
            for i, (x, y) in enumerate(scenario):
                if i % 2 == 0:
                    morpion1.play(x, y)
                    morpion2.is_finished()
                else:
                    morpion2.play(x, y)
                    morpion1.is_finished()
                sleep(0.25)
                if morpion1.finished or morpion2.finished:
                    break
        elif morpion2.IsMyTurn():
            for i, (x, y) in enumerate(scenario):
                if i % 2 == 0:
                    morpion2.play(x, y)
                    morpion1.is_finished()
                else:
                    morpion1.play(x, y)
                    morpion2.is_finished()
                sleep(0.25)
                if morpion1.finished or morpion2.finished:
                    break
        else:
            raise Exception("No one's turn")
        return morpion1.get_winner()
    
    @staticmethod
    def playRandomScenario(morpion1, morpion2):
        scenarionId = randint(0, len(Morpion.Scenario) - 1)
        print("Scenario", scenarionId, " expected result:", Morpion.ExpectedResults[scenarionId])
        return Morpion.playScenario(morpion1, morpion2, Morpion.Scenario[scenarionId])

class Interface():
    def __init__(self):
        self.driver = webdriver.Chrome()
        self.driver.get("http://localhost:3000")
        self.driver.implicitly_wait(0.5)
        # self.driver.maximize_window()
        
        self.connected = False
        
        sleep(1)
        
    def connect(self, username: str, password: str):
        if self.connected: raise AlreadyConnectedException()
        form = self.driver.find_element(By.ID, "login-form")
        username_input = form.find_element(By.ID, "username")
        username_input.send_keys(username)
        password_input = form.find_element(By.ID, "password")
        password_input.send_keys(password)
        form.submit()
        sleep(1)
        self.connected = self.is_connected()
        
    def register(self, username: str, password: str, email: str):
        if self.connected: raise AlreadyConnectedException()
        switch_button = self.driver.find_element(By.ID, "showSignup")
        switch_button.click()
        form = self.driver.find_element(By.ID, "signup-form")
        username_input = form.find_element(By.ID, "signup_username")
        username_input.send_keys(username)
        password_input = form.find_element(By.ID, "signup_password")
        password_input.send_keys(password)
        confirm_password_input = form.find_element(By.ID, "confirm_password")
        confirm_password_input.send_keys(password)
        email_input = form.find_element(By.ID, "email")
        email_input.send_keys(email)
        form.submit()
        sleep(1)
        self.connected = self.is_connected()
        
        
    def connect_or_register(self, username: str, password: str, email: str):
        self.connect(username, password)
        if not self.connected:
            self.register(username, password, email)
            self.connect(username, password)
    
    def disconnect(self):
        if not self.connected: raise NotConnectedException()
        self.driver.find_element(By.ID, "logoutBtn").click()
        sleep(1)
        
    def is_connected(self):
        for cookie in self.get_cookies():
            if cookie["name"] == "username": #check if the username cookie is present
                return True
        return False
        
    def send_chat_message(self, message: str):
        if not self.connected: raise NotConnectedException()
        chat_form = self.driver.find_element(By.ID, "message_form")
        message_input = chat_form.find_element(By.ID, "sendMessage")
        message_input.send_keys(message)
        chat_form.submit()
        sleep(1)
        
    def read_chat_message(self):
        if not self.connected: raise NotConnectedException()
        chat_list = self.driver.find_element(By.ID, "messages")
        messages_items = chat_list.find_elements(By.CLASS_NAME, "message_item")
        messages = []
        for message in messages_items:
            messages.append({
                "author": message.find_element(By.CLASS_NAME, "username").text,
                "content": message.find_element(By.CLASS_NAME, "message").text,
                "date": message.find_element(By.CLASS_NAME, "date").text
            })
        
        return messages
    
    def get_cookies(self):
        return self.driver.get_cookies()
    
    def start_game(self, gameName):
        if not self.connected: raise NotConnectedException()
        gamesContainer = self.driver.find_element(By.CLASS_NAME, "gamesContainer")
        try:
            game = gamesContainer.find_element(By.ID, gameName)
            game.click()
        except:
            raise GameNotFoundException()
        # Wait for the game to start
        sleep(1)
        url = gamesContainer.find_element(By.CLASS_NAME, "roomUrlbrute").text
        return url
    
    def join_game(self, url):
        self.driver.get(url)
        sleep(1)    
    
    def getGamesContainer(self):
        return self.driver.find_element(By.CLASS_NAME, "gamesContainer")
        
    def close(self):
        self.driver.quit()
        
    def goHome(self):
        self.driver.find_element(By.ID, "homeBtn").click()
        
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_value, traceback):
        self.close()
        return False
    
    def wait_for_closing(self):
        WebDriverWait(self.driver, 100000).until(EC.number_of_windows_to_be(0))
        self.driver.quit()
        
        
if __name__ == "__main__":
    with Interface() as interface1, Interface() as interface2:
        interface1.connect("toto", "toto")
        interface2.connect("tata", "tata")
        
        url = interface1.start_game("morpion")
        print(url)
        interface2.join_game(url)
        
        # sleep(1) 
        
        morpion1 = Morpion(interface1.getGamesContainer())
        morpion2 = Morpion(interface2.getGamesContainer())
        
        Morpion.playRandomScenario(morpion1, morpion2)
                
        interface1.goHome()
        interface2.goHome()
        
        sleep(1)