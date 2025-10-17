const mongoose = require('mongoose');

const PetReportSchema = new mongoose.Schema({
    petname: {
        type: String,
        required: true
    },
    petbreed: {
        type: String,
        required: true,
    },
    petage: {
        type: String,
        required: true
    },
    petdescription: {
        type: String,
        required: true
    },
    petimage: {
        type: String,
        required: true
    },
    lastsightlocation: {
        lat: Number,
        lng: Number,
    },
    reporteduser: { type: mongoose.Schema.Types.ObjectId, required: true },
    reportstatus: {
        type: String,
        default: 'Active'
    },
    contactinfo:[
        {
            description:String,
            user:String,
            postedtime:{ type: Date, default: Date.now }
        
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('PetReport', PetReportSchema);

