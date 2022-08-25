const container = document.querySelector('#container');
const signInButton = document.querySelector('#signIn');
const signUpButton = document.querySelector('#signUp');


signInButton.addEventListener('click',() => container.classList.remove('right-panel-active'))
