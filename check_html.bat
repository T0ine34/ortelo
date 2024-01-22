@REM run this script with the path to the html file as the first argument
@echo off
curl -X POST -H "Content-Type: text/html" --data-binary "@%1" https://validator.w3.org/nu/?out=json > html_result.json