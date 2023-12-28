const urlParts = window.location.pathname.split('/');
localStorage.setItem('gameRedirect', JSON.stringify(urlParts));
window.location.href = 'http://[HOST_PLACEHOLDER]';