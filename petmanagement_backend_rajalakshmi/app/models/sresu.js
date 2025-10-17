const mongoose = require('mongoose');
const common=require('../service/common')
const bcrypt=require('bcryptjs')
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true
    }

}, { timestamps: true });
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')|| !this.isModified('email')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    this.email =common.encryptData(this.email);
    next();
});
const user_schema = mongoose.model('User', userSchema);

module.exports = user_schema;
