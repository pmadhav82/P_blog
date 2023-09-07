
let trigerBtn = document.querySelector(".user_pic");
let subMenu = document.querySelector(".sub-menu-wrapper")
let subMenuLinks = document.querySelectorAll(".sub-menu-link");
let modal = document.querySelector(".modal");

const showMenu = ()=>{  

modal.classList.toggle("modalOn");
subMenu.classList.toggle("open");

}

//close the modal when user click outside of the modal

window.addEventListener("click",(e)=>{
    if(e.target===modal){
      modal.classList.toggle("modalOn");
subMenu.classList.toggle("open");  
    }else
    return
})


if(trigerBtn){

    trigerBtn.addEventListener("click",showMenu)
} 

subMenuLinks.forEach(link=>{
    link.addEventListener("click",showMenu);
})

// Them toggle
let toggleBtn = document.getElementById("toggleBtn");
let themeName = document.querySelector(".themeName")


// check theme mode in local storage and set the theme accordingly

window.onload = ()=>{
    if(localStorage.getItem("mode")=== "dark"){
        document.body.classList.add("dark-mode");
        themeName.innerHTML = "Light mode";
    }
    
}


const themToggler = ()=>{
    document.body.classList.toggle("dark-mode");
if(document.body.classList.contains("dark-mode")){
localStorage.setItem("mode", "dark");
themeName.innerHTML = "Light mode";

} else{
    localStorage.setItem("mode", "light");
    themeName.innerHTML = "Dark mode"
}
let theme = localStorage.getItem("mode");

    
}


if(toggleBtn){

    toggleBtn.addEventListener("click", themToggler)
}

