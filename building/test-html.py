from subprocess import run, PIPE
from json import loads, dumps

def test(filepath):
    # curl -X POST -H "Content-Type: text/html" --data-binary "@%1" https://validator.w3.org/nu/?out=json
    result = run(["curl", "-X", "POST", "-H", "Content-Type: text/html", "--data-binary", f"@{filepath}", "https://validator.w3.org/nu/?out=json"], stdout=PIPE)
    return result.stdout.decode("utf-8")    

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python test-html.py <file>")
        exit(1)
    
    result = test(sys.argv[1])
    data = loads(result)
    
    print(f"Found {len(data['messages'])} messages\n")
    
    if data["messages"]:
        for message in data["messages"]:
            print(f"{message['type']} on line {message['lastLine']}:{message['lastColumn']}")
            print(f"\t{message['message']}")
            print(f"\t{message['extract']}")