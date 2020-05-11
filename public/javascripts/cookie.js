if(document.cookie != 0){
    document.cookie++;
}else{
    document.cookie = 1;
}

var text = document.getElementById("visits");
text.innerHTML = document.cookie + " visits";