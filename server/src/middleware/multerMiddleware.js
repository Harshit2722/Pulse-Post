const multer = require("multer");

const storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,"./public/uploads")
    },
    filename: function(req,file,cb){
        const uniqueName = Date.now() + "-" + file.originalname;
        cb(null,uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 7 * 1024 * 1024
    }
})


module.exports = upload;