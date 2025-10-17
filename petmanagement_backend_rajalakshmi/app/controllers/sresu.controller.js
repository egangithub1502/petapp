const { Validator } = require('node-input-validator');
const common = require('../service/common')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');


//schema files
const user_schema = require('../models/sresu')
const petreport_schema = require('../models/stropertepgnissim')



exports.signup = async (req, res) => {
    try {
        const v = new Validator(req.body, {
            email: 'required|email',
            password: 'required|minLength:8',
            name: 'required|minLength:3'
        });
        v.check().then(async (matched) => {
            if (!matched) {
                res.json({ status: false, message: v.errors });
            } else {
                const { name, email, password } = req.body;
                const existingUser = await user_schema.findOne({ email });
                if (existingUser) return res.json({ status: false, message: 'User already exists' });
                const user = new user_schema({ name, email, password });
                await user.save();
                res.json({ status: true, message: 'You are registered successfully!' });
            }
        });
    } catch (error) {
        res.json({ status: false, message: 'Server error', error });
    }
}

exports.signin = async (req, res) => {
    try {
        const v = new Validator(req.body, {
            email: 'required',
            password: 'required',
        });
        v.check().then(async (matched) => {
            if (!matched) {
                res.json({ status: false, message: v.errors });
            } else {
                const { email, password } = req.body;
                const encryptedemail = common.encryptData(email)
                const user = await user_schema.findOne({ email: encryptedemail });
                if (!user) return res.json({ status: false, message: 'User not found' });

                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) return res.json({ status: false, message: 'Invalid credentials' });

                const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, { expiresIn: '1h' });
                res.json({ status: true, message: 'You are logged in successfully!', token });
            }
        })
    } catch (error) {
        res.json({ status: false, message: 'Server error', error });
    }
}
exports.forgotpassword = async (req, res) => {
    try {
        const v = new Validator(req.body, {
            useremail: 'required',
        });
        v.check().then(async (matched) => {
            if (!matched) {
                res.json({ status: false, message: v.errors });
            } else {
                const { useremail } = req.body;
                const existingUser = await user_schema.findOne({ email: common.encryptData(useremail) });
                if (!existingUser) {
                    return res.json({ status: false, message: 'Email address not registered with us! Kindly register your email' });
                }
                const token = jwt.sign({ useremail }, process.env.SECRET_KEY, { expiresIn: '10m' });
                const resetLink = `http://localhost:4200/reset-password?token=${token}`;
                res.json({ status: true, data: resetLink, message: 'Password reset link sent to your email' });
            }
        })
    } catch (error) {
        res.json({ status: false, message: 'Server error', error });
    }
}
exports.resetpassword = async (req, res) => {
    try {
        const v = new Validator(req.body, {
            token: 'required',
            password: 'required',

        });
        v.check().then(async (matched) => {
            if (!matched) {
                res.json({ status: false, message: v.errors });
            } else {
                const { token, password } = req.body;

                try {
                    const decoded = jwt.verify(token, process.env.SECRET_KEY);
                    const existingUser = await user_schema.findOne({ email: common.encryptData(decoded.useremail) });

                    if (!existingUser) {
                        return res.json({ status: false, message: 'Email address not registered with us! Kindly register your email' });
                    }

                    const pwupdateduser = await user_schema.findOneAndUpdate(
                        { email: common.encryptData(decoded.useremail) },
                        { password: await bcrypt.hash(password, 10) },
                        { new: true }
                    );

                    if (!pwupdateduser) {
                        return res.json({ status: false, message: 'User not found' });
                    }
                    res.json({ status: true, message: 'Password reset successfully!' });
                } catch (error) {
                    res.json({ status: false, message: 'Your token was expired.' });
                }
            }
        })
    } catch (error) {
        res.json({ status: false, message: 'Server error', error });
    }
}
exports.reportpetmissing = async (req, res) => {
    try {
        if (!req.file) {
            return res.json({ error: 'Kindly upload pet image' });
        }
        const v = new Validator(req.body, {
            petname: 'required',
            petbreed: 'required',
            petage: 'required',
            locationlat: 'required',
            locationlng: 'required',

            petdescription: 'required'
        });
        v.check().then(async (matched) => {
            if (!matched) {
                res.json({ status: false, message: v.errors });
            } else {
                const { petname, petbreed, petage, locationlng, locationlat, petdescription } = req.body;
                const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
                const newReport = new petreport_schema({
                    petname,
                    petbreed,
                    petage,
                    petimage: imageUrl,
                    petdescription,
                    lastsightlocation: {
                        lat: locationlat,
                        lng: locationlng,
                    },
                    reporteduser: req.userId
                });
                await newReport.save();
                res.json({ status: true, message: 'Your Pet report submitted successfully' });
            }
        })
    } catch (error) {
        res.json({ status: false, message: 'Server error', error });
    }
}
exports.getallpetreports = async (req, res) => {
    try {
        const petReports = await petreport_schema.find({reporteduser:{$ne:new mongoose.Types.ObjectId(req.userId)}}).sort({ createdAt: -1 })
        res.json({ status: true, data: petReports });
    } catch (error) {
        res.json({ status: false, message: 'Server error', error, data: [] });
    }
}
exports.getmypetreports = async (req, res) => {
    try {
        const petReports = await petreport_schema.find({ reporteduser: new mongoose.Types.ObjectId(req.userId) }).sort({ createdAt: -1 });
        res.json({ status: true, data: petReports });
    } catch (error) {
        res.json({ status: false, message: 'Server error', error, data: [] });
    }
}
exports.contactpetowner = async (req, res) => {
    try {
        const v = new Validator(req.body, {
            petid: 'required',
            description: 'required',

        });
        v.check().then(async (matched) => {
            if (!matched) {
                res.json({ status: false, message: v.errors });
            } else {
                const { petid, description } = req.body;
                const petReports = await petreport_schema.findById(petid);
                if (petReports) {
                    await petreport_schema.findByIdAndUpdate(petid, { $push: { contactinfo: { description: description, user: req.userId } } }).then((updRes) => {
                        res.json({ status: true, message: 'Your information to find this pet is submitted successfully' });
                    }).catch((upderr) => {
                        res.json({ status: false, message: 'Something went wrong. Please try again later!' });
                    })
                } else {
                    res.json({ status: false, message: 'No pet data found' });

                }

            }
        })
    } catch (error) {
        res.json({ status: false, message: 'Server error', error });
    }
}

exports.updatepetstatus = async (req, res) => {
    try {
        const v = new Validator(req.body, {
            reportstatus: 'required',
            petid: 'required',
        });
        v.check().then(async (matched) => {
            if (!matched) {
                res.json({ status: false, message: v.errors });
            } else {
                const { petid, reportstatus } = req.body;
                const petReports = await petreport_schema.findById(petid);
                if (petReports) {
                    if ((petReports.reporteduser).toString() == req.userId) {
                        await petreport_schema.findByIdAndUpdate(petid, { $set: { reportstatus } }).then((updRes) => {
                            res.json({ status: true, message: 'Your pet status updated successfully!' });
                        }).catch((upderr) => {
                            res.json({ status: false, message: 'Something went wrong. Please try again later!' });
                        })
                    } else {
                        res.json({ status: false, message: 'Invalid user found' });

                    }
                } else {
                    res.json({ status: false, message: 'No pet data found' });

                }

            }
        })
    } catch (error) {
        res.json({ status: false, message: 'Server error', error });
    }
}