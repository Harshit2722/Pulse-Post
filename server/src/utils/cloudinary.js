const cloudinary = require("cloudinary").v2;
const fs = require("fs");

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
})


const uploadToCloudinary = async (localFilePath)=>{
    try{
        if(!localFilePath) return null;
        
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto",
            folder: "pulse-posts"
        })

        fs.unlinkSync(localFilePath)

        console.log("File uploaded successfully", response.url);
        return response;
    }catch(error){
        if (fs.existsSync(localFilePath)){
            fs.unlinkSync(localFilePath)
        }
        console.log("Error uploading file", error);
        return null;
    }
}

module.exports = {uploadToCloudinary}