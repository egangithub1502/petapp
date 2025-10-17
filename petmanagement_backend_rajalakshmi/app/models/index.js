const dbConfig = require("../config/db.config.js");

const mongoose = require("mongoose");

  const dbconfigconnection = async () => {
    try {
        await mongoose.connect(dbConfig.url, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1); // Exit process with failure
    }
};
module.exports=dbconfigconnection