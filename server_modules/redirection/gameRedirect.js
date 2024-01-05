const urlParts = window.location.pathname.split('/');
console.log(urlParts);
localStorage.setItem('gameRedirect', JSON.stringify(urlParts));
const protocol = window.location.protocol;
window.location.href = "/";