# File Upload using multer in ExpressJS
`multer` is a middleware of NodeJS to handle file upload.
## Instalation
``` npm install multer ```

## Frontend
```
<div class="form-wrapper">
<h3>Upload Profile Picture</h3>

<div class="main">
<form action="/upload" method="POST" enctype="multipart/form-data">

<input type="file" accept="image/*" id="imageInput"  name="userProfile" />
<button type="submit" id="submit" class="btn btn-primary">Upload</button>
</form>

<div class="git">
<img id="imageOutPut" />
<p id="imageName"></p>
</div>

</div>

```
### Upload preview
Following code will enable the preview of choosen image
```javascript
    
let imageInput = document.getElementById("imageInput");
let imageOutput = document.getElementById("imageOutPut");
let imageName = document.getElementById("imageName");
imageInput.onchange = (ev)=>{
    imageOutput.alt = "preview";
    imageOutput.src = URL.createObjectURL(ev.target.files[0]);
    imageName.innerHTML = `<b> ${ev.target.files[0].name} </b>`
    imageOutput.onload = ()=>{
        URL.revokeObjectURL(imageOutput.src);
    }
}

```

## Backend