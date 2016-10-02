var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('Processes', new Schema({
	userId : String,
	timestamp : String,
	botStatus : Boolean,
	firstVar: String,
	step: String,
	qOne: String,
	qTwo: String,
	qThree: String,
	qFour: String
}));