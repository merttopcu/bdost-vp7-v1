var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('Processes', new Schema({
	id : String,
	timestamp : String,
	botStatus : Boolean,
	city: Number,
	job: String	
}));