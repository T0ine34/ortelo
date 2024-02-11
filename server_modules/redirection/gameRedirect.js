const urlParts = window.location.pathname.split('/');
//console.log(urlParts);
localStorage.setItem('gameRedirect', JSON.stringify(urlParts));
window.location.href = "/";