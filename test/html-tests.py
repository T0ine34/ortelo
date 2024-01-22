from requests import get, post
from os import listdir, path
from json import loads
from sys import argv

def get_html_files(folder):
    files = []
    for file in listdir(folder):
        file = path.join(folder, file)
        if path.isdir(file):
            files += get_html_files(file)
        elif file.endswith('.html'):
            files.append(file)
    return files


# the CURL command to check a file is: 
# curl -X POST -H "Content-Type: text/html" --data-binary "filecontent" https://validator.w3.org/nu/?out=json > html_result.json
def check_html_file(file):
    with open(file, 'r') as f:
        html = f.read()
    return post('https://validator.w3.org/nu/?out=json', data=html, headers={'Content-Type': 'text/html'}).json()

def analyze_result(html_result):
    errors = []
    warnings = []
    for message in html_result['messages']:
        if message['type'] == 'error':
            errors.append(message['message'])
        elif message['type'] == 'info':
            warnings.append(message['message'])
    return errors, warnings

def check_html_files(folder):
    files = get_html_files(folder)
    errors = {}
    for file in files:
        html_result = check_html_file(file)
        print('Checking %s...' % file)
        print(html_result)
        errors[file] = analyze_result(html_result)
    return errors


def print_summary(errors):
    print('Summary:')
    print('  %d files checked' % len(errors))
    for file in errors:
        print('  %s: %d errors, %d warnings' % (file, len(errors[file][0]), len(errors[file][1])))
    print("%d errors, %d warnings" % (sum([len(errors[file][0]) for file in errors]), sum([len(errors[file][1]) for file in errors])))
    

if __name__ == '__main__':
    if len(argv) != 2:
        print('Usage: python html_checker.py <folder>')
    else:
        folder = argv[1]
        errors = check_html_files(folder)
        print_summary(errors)
        exit(1 if sum([len(errors[file]) for file in errors]) > 0 else 0)