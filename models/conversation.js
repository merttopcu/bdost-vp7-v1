var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('Conversation', new Schema({
	userId       : String,
	startDate    : String,
	endDate      : String,
	messages 	 :[],
	stats        :{
	    flow: {
	      modelOne: 0,
	      modelTwo: 0,
	      modelPlus: 0,
	      greeting: 0,
	      exit: 0,
	      runAgain: 0,
	      notRecognized: 0
	    },
	    received: {
	      modelOne: 0,
	      modelTwo: 0,
	      modelPlus: 0,
	      greeting: 0,
	      exit: 0,
	      runAgain: 0,
	      notRecognized: 0
	    },
	    sent: {
	      modelOne: 0,
	      modelTwo: 0,
	      modelPlus: 0,
	      greeting: 0,
	      exit: 0,
	      runAgain: 0,
	      notRecognized: 0,
	      link:0
	    }
	}
}));