const countEl = document.querySelector('#count');
const button_1 = document.querySelector('#decrease');
const button_2 = document.querySelector('#reset');
const button_3 = document.querySelector('#increase');
let count = 0 ;
button_1.addEventListener('click' , function(){
    count--;
    countEl.textContent = count;
    console.log('clicked!')
}); 
button_2.addEventListener('click' , function(){
    count=0;
    countEl.textContent = count;
    console.log('clicked!')
}); 
button_3.addEventListener('click' , function(){
    count++;
    countEl.textContent = count;
    console.log('clicked!')
}); 