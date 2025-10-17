const router = require("express").Router();
const usercontroller = require('../controllers/sresu.controller')
const commonservice = require('../service/common')

const path = require('path');
const multer = require('multer');
const fs = require('fs');

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null,uploadDir); 
    },
   filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); 
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    }
});
router.post('/signup', usercontroller.signup)
router.post('/signin', usercontroller.signin)
router.post('/forgot_password', usercontroller.forgotpassword)
router.post('/reset_password', usercontroller.resetpassword)

router.post('/report_pet_missing', commonservice.userauth,upload.single('image'), usercontroller.reportpetmissing)
router.get('/get_all_pet_reports', commonservice.userauth, usercontroller.getallpetreports)
router.get('/get_my_pet_reports', commonservice.userauth, usercontroller.getmypetreports);
router.post('/contact_pet_owner', commonservice.userauth, usercontroller.contactpetowner);
router.post('/update_pet_status',commonservice.userauth,usercontroller.updatepetstatus)



module.exports = router
