const urlParts = window.location.pathname.split('/');
localStorage.setItem('gameRedirect', JSON.stringify(urlParts));
const protocol = window.location.protocol;
window.location.href = protocol + '//' + '[HOST_PLACEHOLDER]';