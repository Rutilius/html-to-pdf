# Convert HTML pages to PDF pages

This project will render an html page using an headless chome instance and converting it in a pdf file

## Usage

All '.html' document in the "src/pages" folder will be rendered as different pdf and the result will be in the "dist" folder  
Subfolder will be ignored

To set custom configuration on each '.html' page you can add a '.json' file in the "src/configs" folder, the file should have the same name as the '.html' page, all the acepted values are described in the "lib/templates/TemplateConfig.jsonc" 

The pages support the use of local external file by adding them in the "src/assets" folder.  
The supported local external files are imported in this order:
- CSS files will substitute the html at the location of the import statement:
    - @import "../assets/.../cssName.css";
- Images will be converted in base64 and inserted into the HTML file to do this need to be imported with:
    - Tag: <img src="../assets/.../imageName.imageExtension" 
    - CSS Property: background-image: url("../assets/.../imageName.imageExtension")

You can use any external remove file as normal html behaviour.  
The redering of the page will wait the network idle by default you can change this behaviour using the config file 