@REM run this script with the path to the html file as the first argument
@REM @echo off
@REM curl -X POST -H "Content-Type: text/html" --data-binary "@%1" https://validator.w3.org/nu/?out=json > html_result.json
@REM @rem show the result in the console
@REM type html_result.json
@rem open the result in the default browser

@echo off
python building/test-html.py %1
