'use strict';

const request     = require('request'),
      config      = require('config'),
      mongoose    = require('mongoose'),
      fs          = require('fs'),
      levenshtein = require('fast-levenshtein');

var facebook	    = require('../facebook.js'),
    //botAnalytics  = require('../botAnalytics.js'),
    bdostTxt      = require('./bdostTxt.js');

const sessions    = {};

// database connection
mongoose.connect(config.get('DATABASE'));
var db            = mongoose.connection,
    userDB        = require('../models/user.js'),
    messageDB 	  = require('../models/message.js'),
    conversationDB= require('../models/conversation.js'),
    authorizedDB  = require('../models/authorizedRequests.js');    


// database functions
function findOrCreateUser(senderID, user){

  var firstName = JSON.parse(user).first_name,
      lastName  = JSON.parse(user).last_name,
      profilePic= JSON.parse(user).profile_pic,
      locale    = JSON.parse(user).locale,
      timeZone  = JSON.parse(user).timezone,
      gender    = JSON.parse(user).gender;

  userDB.findOne({ 'userId': senderID }, function (err, dbUser) {
    if (err) {
      console.error(err);
    }

    if (dbUser === null){
      var dbUser = new userDB({
        userId: senderID,
        fullName: firstName +" "+ lastName,
        profilePic: profilePic,
        gender: gender,
        locale: locale,
        timezone: timeZone,
        firstSeen: new Date(),
        lastSeen: new Date()
      });
      dbUser.save(function (err) {
        if (err) console.error(err);
      });
    }else{
      updateUser(senderID);
    }
  });
}
function updateUser(senderID){
  userDB.update({'userId': senderID}, {$set: {lastSeen:new Date()}}, function (err, results){
    if (err) console.error(err);
  });
}

function findConversation(senderID, recipientId, messageId, dbProcess, linkCount){
  var sessionUser     = findOrCreateSession(senderID);
  var fd              = sessions[sessionUser].context;
  var userID;

  if(senderID){
    userID = senderID;
  }else if(recipientId){
    userID = recipientId;
  }else{
    console.log("error in findConversation");
  }

  conversationDB.find({'userId': userID}).sort({_id:-1}).limit(1).exec(function (err, dbConversation) {
    
    if (err) {console.error(err);}

    if(!dbConversation.length){
      //conversation couln't find. create new one.
      createConversation(userID, messageId);
    }else{
      //conversation found.
     
      var endDate = new Date(dbConversation[0].endDate).getTime();
      var newDate = new Date().getTime();
      var result = newDate - endDate;
      var fiveMin = 1000 * 60 * 1;
      
      if(result < fiveMin){
        //if it is not expired, update.
        dbConversation[0].messages.push(messageId);
        if(senderID){
          dbConversation[0].stats.received[fd.db]+=1;
        }else{
          if(dbProcess==="link"){
            fd.linkStep++;
            dbConversation[0].stats.sent[dbProcess]=fd.linkStep;
          }else{
            dbConversation[0].stats.sent[dbProcess]+=1;
          }
        }
        if(fd.dbStep === true){
          if(senderID){
            dbConversation[0].stats.flow[fd.db]+=1; 
          }
        }
        var newEndDate = new Date();
        newEndDate.setMinutes(newEndDate.getMinutes()+1);
        dbConversation[0].endDate = newEndDate;
        dbConversation[0].save();
        
      } else{
        //conversation expired. create new one.
        createConversation(userID,messageId);
      }

    }

  });
}
function createConversation(senderID, messageId){
  var sessionUser     = findOrCreateSession(senderID);
  var fd              = sessions[sessionUser].context;
  fd.linkStep = 0;

  var dtStart = new Date();
  var dtEnd = new Date(dtStart);
  dtEnd.setMinutes(dtStart.getMinutes()+1);
  var newConversation = new conversationDB({
    userId: senderID,
    startDate: dtStart,
    endDate: dtEnd,
    messages:[],
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
  });

  newConversation.messages.push(messageId);
  if(fd.dbStep === true){
    newConversation.stats.flow[fd.db]+=1; 
  }
  newConversation.stats.received[fd.db]+=1;

  newConversation.save(function (err) {
    if (err) console.error(err);
  });
}
function saveMessage(senderID, recipientId, message, dbProcess){
  var receivedMessage = new messageDB({senderId:senderID, recipientId:recipientId, message: message,timestamp: new Date()});
  receivedMessage.save(function (err,savedMessage) {
    if (err) console.error(err);
    setTimeout(function() {
      findConversation(senderID, recipientId, savedMessage.id, dbProcess);
    }, 1000)
      
  });
}

function pingAuthorized(senderID, message, fullName){
  var authorized = new authorizedDB({userId: senderID, timestamp: new Date(), message: message, userName: fullName});
  authorized.save(function (err) {
    if (err) console.error(err);
  });
}

// bdost-framework functions
function findOrCreateSession(senderID){
  let sessionId;
  // Let's see if we already have a session for the user fbid
  Object.keys(sessions).forEach(k => {
    if (sessions[k].fbid === senderID) {
      // Yep, got it!
      sessionId = k;
    }
  });
  if (!sessionId) {
    sessionId = new Date().toISOString();
    sessions[sessionId] = {fbid: senderID, context: {
      activeUser      :"",
      botStatus       :false,
      pOne            :false,
      pPlus           :false,
      pGreeting       :false,
      pExit           :false,
      pNotRecognized  :false,
      pRunAgain       :false,
      activeProcess   :"",
      firstVar        :"",
      qOne            :"",
      qTwo            :"",
      qThree          :"",
      qFour           :"",
      secondVar       :"",
      step            :0,
      db              :"",
      dbStep          :false,
      linkStep        :0 
    }};
  }
  return sessionId;
}
function findRequiredModel(message,file){

  var model = fs.readFileSync(__dirname + file).toString().split("\n");

  var sentence = manuelLowerCase(message);
  var checkFound = false;
  model.forEach(function(entry) {
      if (sentence.toString().indexOf(manuelLowerCase(entry)) >= 0) { 
        checkFound = true;
      }
  });
  return checkFound;
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function closestNumber(questionCode, closestTo){
  var qFile = JSON.parse(fs.readFileSync(__dirname + bdostTxt.questions));
  var q = qFile.questions[questionCode-1];
  var answers = q.answers;

  var closest = Math.max.apply(null, answers); //Get the highest number in arr in case it match nothing.

  for(var i = 0; i < answers.length; i++){ //Loop the array
    if(answers[i] >= closestTo && answers[i] < closest) closest = answers[i]; //Check if it's higher than your number, but lower than your closest value
  }

  return closest; // return the value
}

function getAnswer(message,questionCode){
  var qFile = JSON.parse(fs.readFileSync(__dirname + bdostTxt.questions));
  var q = qFile.questions[questionCode-1];

  var keyword = manuelLowerCase(message);
  var answers = q.answers;
  var checkFound = false;

  for(var i in answers){
    if(keyword.toString().indexOf(manuelLowerCase(answers[i])) >= 0){
      checkFound = true;
    }
  }
  return checkFound;
}

function manuelLowerCase(text){
  var letters = { "İ": "i", "I": "ı", "Ş": "ş", "Ğ": "ğ", "Ü": "ü", "Ö": "ö", "Ç": "ç" };
  // manuel toLowerCase
  var sentence = text.replace(/[A-Z]/g, function(ch) {return String.fromCharCode(ch.charCodeAt(0) | 32);})
  // toLowerCase remained Turkish characters
  sentence = sentence.replace(/(([İIŞÜÇÖĞ]))/g, function(letter){ return letters[letter]; });

  return sentence;
}
function getExpression(message){
  var sentence = manuelLowerCase(message);
  var distance = '';
  var closest  = 50;
  var expression = '';

  // read json file.
  var expressions = JSON.parse(fs.readFileSync(__dirname + bdostTxt.expressions));

  for(var i=0; i < expressions.trExpressions.length; i++){

    distance = levenshtein.get(manuelLowerCase(expressions.trExpressions[i].expression), sentence, { useCollator: true});
    if(distance < closest){
      closest = distance;
      expression = expressions.trExpressions[i].expression;
    }

    // if expression has an alias, check them all as well.
    if(expressions.trExpressions[i].alias){
      for(var j=0; j<expressions.trExpressions[i].alias.length; j++){
        distance = levenshtein.get(manuelLowerCase(expressions.trExpressions[i].alias[j]), sentence, { useCollator: true});
        if(distance < closest){
          closest = distance;
          expression = expressions.trExpressions[i].expression;
        }
      }
    }
    
  }

  if(closest > 2){
    expression = "";
  }
  
  return expression;
}

function getActiveUser(senderID){
  var sessionUser     = findOrCreateSession(senderID);
  var fd              = sessions[sessionUser].context;
  //we can also use just "name" parameter to get user's full name.
  var url = 'https://graph.facebook.com/v2.6/'+senderID+'?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token='+facebook.PAGE_ACCESS_TOKEN;
  return new Promise((resolve, reject) => {
    // select http or https module, depending on reqested url
    const lib = url.startsWith('https') ? require('https') : require('http');
    const request = lib.get(url, (response) => {
      // handle http errors
      if (response.statusCode < 200 || response.statusCode > 299) {
         reject(new Error('Failed to load page, status code: ' + response.statusCode));
       }
      // temporary data holder
      const body = [];
      // on every content chunk, push it to the data array
      response.on('data', (chunk) => body.push(chunk));
      // we are done, resolve promise with those joined chunks
      response.on('end', function(){ 
        var firstName = JSON.parse(body).first_name,
            lastName  = JSON.parse(body).last_name,
            profilePic= JSON.parse(body).profile_pic,
            locale    = JSON.parse(body).locale,
            timeZone  = JSON.parse(body).timezone,
            gender    = JSON.parse(body).gender;

           
        var username = bdostTxt.txtGreeting(firstName + " " + lastName);
        
        //facebook.sendTextMessage(senderID,username,fd.db);

        facebook.sendQuickReply(senderID,username,fd.db);


        // send user information to Bot Analytics
        //botAnalytics.engage(firstName,lastName,profilePic,locale,timeZone,gender,senderID);

        // create or find user for Bdost-Framework

        findOrCreateUser(senderID,body);

        resolve(username);


      });
    });
    // handle connection errors of the request
    request.on('error', (err) => reject(err))
    })
}

function clearSessionVariables(senderID){
  var sessionUser     = findOrCreateSession(senderID);
  var fd              = sessions[sessionUser].context;

  fd.activeProcess    = "";
  fd.firstVar         = "";
  fd.firstSubVar      = "";
  fd.secondVar        = "";
  fd.step             = 0;
  fd.qOne             = "";
  fd.qTwo             = "";
  fd.qThree           = "";
  fd.qFour            = "";
}
function clearSessionProcesses(senderID){
  var sessionUser     = findOrCreateSession(senderID);
  var fd              = sessions[sessionUser].context;

  fd.pOne   = false;
  fd.pPlus  = false;

  fd.pGreeting      = false;
  fd.pExit          = false;
  fd.pRunAgain      = false;
  fd.pNotRecognized = false;
}

// main function
function flowDiagram(senderID,messageText){
  var sessionUser     = findOrCreateSession(senderID);
  var fd              = sessions[sessionUser].context;
  

  if(fd.botStatus){

    fd.pOne   = findRequiredModel(messageText,bdostTxt.modelOneKeywords);
    fd.pPlus  = findRequiredModel(messageText,bdostTxt.modelPlusKeywords);

    fd.pGreeting = findRequiredModel(messageText,bdostTxt.greetingKeywords);
    fd.pExit     = findRequiredModel(messageText,bdostTxt.exitKeywords);

    //Clear logic to begin process from zero.
    if(fd.pOne || fd.pPlus){
      clearSessionVariables(senderID);
    }

    // MODEL ONE'S PROCESSES
    if(fd.pOne === true || fd.activeProcess === "pOne"){
      stepOne(senderID,messageText);
    }

    // MODEL PLUS'S PROCESSES
    else if(fd.pPlus === true){
      stepPlus(senderID,messageText);
    }

    else{

      if(fd.pGreeting){
        stepGreeting(senderID);
      }else if(fd.pExit){
        stepExit(senderID);
      }else{
        fd.pNotRecognized = true;
        stepNotRecognized(senderID);
      }
    }

    //if we are already in process move to the next step.
    if(fd.activeProcess){
      fd.step+=1;
    }
  }else{
    fd.pRunAgain = findRequiredModel(messageText,bdostTxt.reRunKeywords);
    
    if(fd.botStatus === false){
      if(fd.pOne !== "shutdown" || fd.pPlus !== "shutdown"){
          stepGreeting(senderID);  
          fd.botStatus = true;
      }else{
        if(fd.pRunAgain){
          stepRunAgain(senderID);
          fd.botStatus = true;
        }
      }
      //otherwise bot is off.
    }
  }
}

// flow functions
function stepOne(senderID, messageText){
  var sessionUser     = findOrCreateSession(senderID);
  var fd              = sessions[sessionUser].context;

  if(fd.step === 0){
    fd.activeProcess = "pOne";
    fd.db     = "modelOne";
    fd.dbStep = true;
    facebook.sendModelOneCTA(senderID,bdostTxt.MOWelcome,fd.db);
  }

  if(fd.step === 1 || fd.firstVar === ""){
    fd.firstVar = getExpression(messageText);
    if(fd.firstVar === bdostTxt.MOCTA){
      facebook.sendQuestion(senderID,1,fd.db);
    }else if(fd.firstVar === bdostTxt.MOCTAn){
      clearSessionVariables(senderID);
      clearSessionProcesses(senderID);
      stepNotRecognized(senderID);
    }
    else{
      fd.step = 0;
    }

    fd.dbStep = false;
  }

  if(fd.step === 2 && fd.qOne === ""){

    //check if answer is valid
    if(getAnswer(messageText,1)){
      fd.qOne = messageText;
    }

    if(fd.qOne === ""){
      fd.step = 1;
      facebook.sendQuestion(senderID,1,fd.db);
    }else{
      facebook.sendQuestion(senderID,2,fd.db);
    }
  }

  if(fd.step === 3 && fd.qTwo === ""){

    if(getAnswer(messageText,2)){
      fd.qTwo = messageText;
    }
    
    if(fd.qTwo === ""){
      fd.step = 2;
      facebook.sendQuestion(senderID,2,fd.db);
    }else{
      facebook.sendQuestion(senderID,3,fd.db);
    }
  }

  if(fd.step === 4 && fd.qThree === ""){

    if(isNumeric(messageText)){
      fd.qThree = closestNumber(3,messageText)
    }else{
      if(getAnswer(messageText,3)){
        fd.qThree = messageText;
      }
    }

    if(fd.qThree === ""){
      fd.step = 3;
    }else{
      facebook.sendQuestion(senderID,4,fd.db);
    }
  }

  if(fd.step === 5 && fd.qFour === ""){
    fd.qFour = messageText;
    if(fd.qTwo === ""){
      fd.step = 3;
    }else{

      facebook.sendTextMessage(senderID,bdostTxt.MOResult,fd.db);
      setTimeout(function() {
        facebook.sendTextMessage(senderID,bdostTxt.MOSearchMessage,fd.db);
      }, 1000)
      setTimeout(function() {
        facebook.sendTextMessage(senderID,"API goes here.",fd.db);
        facebook.sendTextMessage(senderID,"a1:"+fd.qOne+" a2:"+fd.qTwo+" a3:"+fd.qThree+" a4:"+fd.qFour);
      }, 2000)
    
      setTimeout(function() {
        facebook.sendModelOneCTA(senderID,bdostTxt.MOEnd,fd.db);
        clearSessionVariables(senderID);
        clearSessionProcesses(senderID);
        fd.activeProcess = "pOne";
        fd.db     = "modelOne";
        fd.step   = 1;
      }, 3000)
      
    }
  }
}

function stepPlus(senderID, messageText){
  var sessionUser     = findOrCreateSession(senderID);
  var fd              = sessions[sessionUser].context;

  if(fd.step === 0){
    fd.activeProcess = "pPlus";
    fd.db     = "modelPlus";
    fd.dbStep = true;
    facebook.sendTextMessage(senderID,bdostTxt.MPWelcome,fd.db);
    //to keep valid the order of message 
    setTimeout(function() {
      facebook.sendRunAgainMessage(senderID,fd.db);
    }, 1000)

    //API
    pingAuthorized(senderID, messageText, fd.activeUser);
    
    clearSessionVariables(senderID);
    clearSessionProcesses(senderID);

    fd.botStatus = false;
    fd.pOne = fd.pPlus = "shutdown";
    console.log(fd.botStatus + " after authorized person request.");
  }
}

function stepGreeting(senderID){
  var sessionUser     = findOrCreateSession(senderID);
  var fd              = sessions[sessionUser].context;
  
  fd.db     = "greeting";
  fd.dbStep = true;
  
  getActiveUser(senderID)
    .then((body) => fd.activeUser = body)
    .catch((err) => console.log(err));
}
function stepExit(senderID){
  var sessionUser     = findOrCreateSession(senderID);
  var fd              = sessions[sessionUser].context;
  
  fd.db     = "exit";
  fd.dbStep = true;

  facebook.sendTextMessage(senderID,bdostTxt.txtBye,fd.db);
}
function stepNotRecognized(senderID){
  var sessionUser     = findOrCreateSession(senderID);
  var fd              = sessions[sessionUser].context;
  
  fd.db     = "notRecognized";
  fd.dbStep = true;
  clearSessionProcesses(senderID);
  facebook.sendButtonMessage(senderID,fd.db);
}
function stepRunAgain(senderID){
  var sessionUser     = findOrCreateSession(senderID);
  var fd              = sessions[sessionUser].context;
  
  fd.db     = "runAgain";
  fd.dbStep = true;
  clearSessionProcesses(senderID);
  clearSessionVariables(senderID);
  facebook.sendTextMessage(senderID,bdostTxt.txtAgain),fd.db;
}

exports.saveMessage           = saveMessage;

exports.sessions              = sessions;
exports.flowDiagram           = flowDiagram;
exports.findOrCreateSession   = findOrCreateSession;
exports.clearSessionVariables = clearSessionVariables;
exports.clearSessionProcesses = clearSessionProcesses;
exports.getActiveUser         = getActiveUser;

exports.stepOne               = stepOne;
exports.stepPlus              = stepPlus;

exports.stepGreeting          = stepGreeting;
exports.stepExit              = stepExit;
exports.stepNotRecognized     = stepNotRecognized;
exports.stepRunAgain          = stepRunAgain;