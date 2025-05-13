
let modals = document.querySelectorAll(".modal-wrapper");
let tiggerbtn = document.querySelectorAll(".tiggerbtn");
let cancelbtns = document.querySelectorAll(".cancelbtn");




// open modal
tiggerbtn.forEach((btn, i) => {
  tiggerbtn[i].addEventListener("click", () => {
    modals[i].classList.toggle("show-modal");

  })

})

//cancle modal when cancle btn is clicked
cancelbtns.forEach((btn, i) => {
  cancelbtns[i].addEventListener("click", () => {
    modals[i].classList.toggle("show-modal");
  })
})




// cancel modal when user clicked outside the box
window.addEventListener("click", (e) => {

  for (const modal of modals) {

    if (e.target === modal) {
      modal.classList.toggle("show-modal");
    }
  }


})
