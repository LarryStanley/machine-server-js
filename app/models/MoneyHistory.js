var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('MoneyHistory', new Schema({ 
    user_id: String,
    user_name: String,
    item: String, 
    amount: Number,
    location: {
    	latitude: Number,
    	longitude: Number
    },
    time: { 
    	type: Date, default: Date.now 
    },
    category: String
}));