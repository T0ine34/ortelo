// Get the user code given in the url parameters
function getUrlParams(url) {
    const params = {};
    const urlSearchParams = new URLSearchParams(url.split('?')[1]);
    for (const [key, value] of urlSearchParams.entries()) {
        params[key] = value;
    }
    return params;
}
const redirectUrl = window.location.href;
const urlParams = getUrlParams(redirectUrl);


let token;
// Get the access token for us, the bearer
fetch('/getAccessToken', { 

    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'code=' + urlParams.code

}).then(response => response.json())
.then(data => {

    token = data.access_token; 

}).then(() => {

    // Get the information about the user (trying to login/signup) with the access token
    fetch('https://graph.microsoft.com/v1.0/me', { method: 'GET', headers: {'Authorization': `Bearer ${token}` } })
    .then(response => response.json())
    .then(data => {


        console.log(data);


    }) .catch(error => { console.error('Error:', error); });
});