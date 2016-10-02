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
    processesDB	  = require('../models/processes.js'),
    authorizedDB  = require('../models/authorizedRequests.js');    


// database functions
function findOrCreateProcess(senderID, message){
  var sessionUser = findOrCreateSession(senderID);
  processesDB.findOne({ 'id': senderID }, 'botStatus', function (err, dbProcess) {
    if (err) {
      console.error(err);
    } else if (dbProcess === null){
      var dbProcess = new processesDB({id: senderID, timestamp: new Date(), botStatus: true});
      dbProcess.save(function (err) {
        if (err) console.error(err);
      });
      //sessions[sessionUser].context.botStatus = true;
    } else {
      //sessions[sessionUser].context.botStatus = dbProcess.botStatus;
    };
  });
}

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

function setBotStatus(senderID, botStatus){
  processesDB.update({'id': senderID}, {$set: {botStatus:botStatus}}, function (err, results){
    if (err) console.error(err);
  });
}

function setSearchPreferences(senderID, firstVar, secondVar){
  processesDB.update({'id': senderID}, {$set: {city:firstVar, job:secondVar}}, function (err, results){
    if (err) console.error(err);
  });
}

function pingAuthorized(senderID, message, fullName){
  var authorized = new authorizedDB({userId: senderID, timestamp: new Date(), message: message, userName: fullName});
  authorized.save(function (err) {
    if (err) console.error(err);
  });
}

// product APIs
function sendSearchResults(senderID, firstVar, secondVar, firstSubVar=null) {
  var sessionUser     = findOrCreateSession(senderID);
  var fd              = sessions[sessionUser].context;
  //Test Url : http://webapi.kariyer.net/API/Job/JobListByKeywordAndCity?keyword=yazilim&city=34
  var keyword = secondVar.replace(/ /g,'%20')
  keyword = (((((((((((keyword.replace(/ya da/gi,'%20')).replace(/ /g,'%20')).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')).replace(/İ/g, 'i')).replace(/Ü/gi, 'u')).replace(/Ş/gi, 's')).replace(/Ç/gi, 'c')).replace(/ö/gi, 'o')).replace(/ğ/gi,'g')).replace(/ı/gi,'i')).replace(/yada/gi,'%20'));

  var base = "webapi.kariyer.net";
  var returnSearchURL;
  var path;
  var oldWebSearchURL = 'http://www.kariyer.net/is-ilanlari/#&ct=c'+ getCityCode(firstVar) +'&kw=' + secondVar.replace(' ','%20');
  
  facebook.sendTextMessage(senderID,bdostTxt.MOStepTwo(firstVar,secondVar),fd.db);
  
  setSearchPreferences(senderID, getCityCode(firstVar), secondVar);

  var searchResults = '';
  var jobTitle = ['', '', ''];
  var jobDescription = ['', '', ''];
  var jobUrl = ['', '', ''];
  var jobLogo = ['', '', ''];
  var searchResponse = 0;

  //modified by alperen.
  var returnSearchURL; 
  if(firstSubVar){
    //we are gonna change it when we get district information from kariyer.net
    path = "/API/Job/JobListByKeywordAndCity?keyword=" + keyword + "&city=" + getCityCode(firstVar) + "&take=5";
    returnSearchURL = facebook.SERVER_URL + "/device?f="+getCityCode(firstVar)+"&s="+secondVar+"&d="+getDistrictCode(firstSubVar);
  }else{
    path = "/API/Job/JobListByKeywordAndCity?keyword=" + keyword + "&city=" + getCityCode(firstVar) + "&take=5";
    returnSearchURL = facebook.SERVER_URL + "/device?f="+getCityCode(firstVar)+"&s="+secondVar;
  }

  var url = base + path;
  const lib = url.startsWith('https') ? require('https') : require('http');

  var options = {
    host: base,
    path: path,
    headers: {
      "ClientId": "428C12E1-948A-474F-BE13-ABB80CD8D6C1",
      "ClientSecret": "3262C3F3-142B-4F60-A5E9-5D035B3F9704",
      "Content-Type": "application/json; charset=utf-8"
    }
  };

  var callback = function(response){
      // handle http errors
      if (response.statusCode < 200 || response.statusCode > 299) {
         reject(new Error('Failed to load page, status code: ' + response.statusCode));
      }
      // temporary data holder
      var body = [];
      var picFileName = ';';
      // on every content chunk, push it to the data array
      response.on('data', function(chunk){
        body += chunk;
      });
      // we are done, resolve promise with those joined chunks
      response.on('end', function(){ 
        //console.log(body);
        searchResults = JSON.parse(body);
        for (var n = 0; n < 5; n++) {
          if (typeof searchResults.JobList[n] !== 'undefined') {
            searchResponse = searchResponse + 1;
            jobTitle[n] = searchResults.JobList[n].Title
            jobDescription[n] = 'Firma: ' + searchResults.JobList[n].EmployerName;
            jobUrl[n] = searchResults.JobList[n].ApplyLink.replace('/?','?');

            picFileName = 'http://www.jobmin.biz/kd-gorseller/kd-gorsel--' + randomIntInc(1,15) + '.jpg';
            //console.log('gorsel filename: ', picFileName);
            jobLogo[n] = picFileName;
          };  
        };

        /*console.log('searchResponse: ', searchResponse);
        console.log('jobTitle: ', jobTitle);
        console.log('jobDescription: ', jobDescription);
        console.log('jobUrl: ', jobUrl);
        console.log('jobLogo: ', jobLogo);*/

        if (searchResponse === 1) {
            var newmessageData = {
              "attachment": {
                "type": "template",
                "payload": {
                  "template_type": "generic",
                  "elements": [{
                    "title": jobTitle[0],
                      "subtitle": jobDescription[0],
                          "image_url": jobLogo[0],
                          "buttons": [{
                      "type": "web_url",
                      "url": jobUrl[0],
                      "title": "İlana Git"
                    }]
                  }]
                }
              }
            };
        }else if (searchResponse === 2) {
          var newmessageData = {
            "attachment": {
              "type": "template",
              "payload": {
                "template_type": "generic",
                "elements": [{
                  "title": jobTitle[0],
                    "subtitle": jobDescription[0],
                        "image_url": jobLogo[0],
                        "buttons": [{
                    "type": "web_url",
                    "url": jobUrl[0],
                    "title": "İlana Git"
                  }]
                },{
                  "title": jobTitle[1],
                  "subtitle": jobDescription[1],
                  "image_url": jobLogo[1],
                  "buttons": [{
                    "type": "web_url",
                    "url": jobUrl[1],
                    "title": "İlana Git"
                  }]
                }]
              }
            }
          };
        }else if (searchResponse === 3) {
          var newmessageData = {
            "attachment": {
              "type": "template",
              "payload": {
                "template_type": "generic",
                "elements": [{
                  "title": jobTitle[0],
                    "subtitle": jobDescription[0],
                        "image_url": jobLogo[0],
                        "buttons": [{
                    "type": "web_url",
                    "url": jobUrl[0],
                    "title": "İlana Git"
                  }]
                },{
                  "title": jobTitle[1],
                  "subtitle": jobDescription[1],
                  "image_url": jobLogo[1],
                  "buttons": [{
                    "type": "web_url",
                    "url": jobUrl[1],
                    "title": "İlana Git"
                  }]
                },{
                  "title": jobTitle[2],
                  "subtitle": jobDescription[2],
                  "image_url": jobLogo[2],
                  "buttons": [{
                    "type": "web_url",
                    "url": jobUrl[2],
                    "title": "İlana Git"
                  }]
                }]
              }
            }
          };
        }else if (searchResponse === 4) {
          var newmessageData = {
            "attachment": {
              "type": "template",
              "payload": {
                "template_type": "generic",
                "elements": [{
                  "title": jobTitle[0],
                    "subtitle": jobDescription[0],
                        "image_url": jobLogo[0],
                        "buttons": [{
                    "type": "web_url",
                    "url": jobUrl[0],
                    "title": "İlana Git"
                  }]
                },{
                  "title": jobTitle[1],
                  "subtitle": jobDescription[1],
                  "image_url": jobLogo[1],
                  "buttons": [{
                    "type": "web_url",
                    "url": jobUrl[1],
                    "title": "İlana Git"
                  }]
                },{
                  "title": jobTitle[2],
                  "subtitle": jobDescription[2],
                  "image_url": jobLogo[2],
                  "buttons": [{
                    "type": "web_url",
                    "url": jobUrl[2],
                    "title": "İlana Git"
                  }]
                },{
                  "title": jobTitle[3],
                  "subtitle": jobDescription[3],
                  "image_url": jobLogo[3],
                  "buttons": [{
                    "type": "web_url",
                    "url": jobUrl[3],
                    "title": "İlana Git"
                  }]
                }]
              }
            }
          };
        }else if (searchResponse === 5) {
          var newmessageData = {
            "attachment": {
              "type": "template",
              "payload": {
                "template_type": "generic",
                "elements": [{
                  "title": jobTitle[0],
                    "subtitle": jobDescription[0],
                    "image_url": jobLogo[0],
                    "buttons": [{
                    "type": "web_url",
                    "url": jobUrl[0],
                    "title": "İlana Git"
                  }]
                },{
                  "title": jobTitle[1],
                  "subtitle": jobDescription[1],
                  "image_url": jobLogo[1],
                  "buttons": [{
                    "type": "web_url",
                    "url": jobUrl[1],
                    "title": "İlana Git"
                  }]
                },{
                  "title": jobTitle[2],
                  "subtitle": jobDescription[2],
                  "image_url": jobLogo[2],
                  "buttons": [{
                    "type": "web_url",
                    "url": jobUrl[2],
                    "title": "İlana Git"
                  }]
                },{
                  "title": jobTitle[3],
                  "subtitle": jobDescription[3],
                  "image_url": jobLogo[3],
                  "buttons": [{
                    "type": "web_url",
                    "url": jobUrl[3],
                    "title": "İlana Git"
                  }]
                },{
                  "title": jobTitle[4],
                  "subtitle": jobDescription[4],
                  "image_url": jobLogo[4],
                  "buttons": [{
                    "type": "web_url",
                    "url": jobUrl[4],
                    "title": "İlana Git"
                  }]
                }]
              }
            }
          };
        };

        // removed by alperen.
        /*if (searchResults.MobileUrl){
          returnSearchURL = searchResults.MobileUrl;
        } else if (searchResults.WebUrl){
          returnSearchURL = searchResults.WebUrl;
        } else {
          returnSearchURL = oldWebSearchURL;
        };*/

        if(searchResponse > 0){
          facebook.sendGenericMessage(senderID,newmessageData);
          setTimeout(function() {
            //recipientId,text,title,url
            facebook.sendLink(senderID,bdostTxt.MOEnd,bdostTxt.MOEndButton,returnSearchURL,fd.db);
          }, 2000)

          setSearchPreferences(senderID,getCityCode(firstVar),secondVar);
          
        }else{
          facebook.sendTextMessage(senderID,bdostTxt.MOFailure,fd.db);
        }

      });
  };

  lib.request(options,callback).end();
}

function sendResetPassword(senderID, firstVar) {
  var sessionUser     = findOrCreateSession(senderID);
  var fd              = sessions[sessionUser].context;
  var url = 'http://www.kariyer.net/website/teknikdestek/sifremiunuttum/sifreIslemleri.aspx?eposta=' + firstVar;
  return new Promise((resolve, reject) => {
    // select http or https module, depending on reqested url
    const lib = url.startsWith('https') ? require('https') : require('http');
    const request = lib.get(url, (response) => {
      // handle http errors
      if (response.statusCode < 200 || response.statusCode > 299) {
         reject(new Error('Failed to load page, status code: ' + response.statusCode));
       }
      // temporary data holder
      var body = [];
      // on every content chunk, push it to the data array
      response.on('data', function(chunk){
        body += chunk;
      });
      // we are done, resolve promise with those joined chunks
      response.on('end', function(){ 
        //console.log(body);
        //console.log("url is: " + url);
        var emailSentSuccessfully = body.includes('sıfırlama');
        var emailNotRegistered    = body.includes('e-posta adresini giriniz'); 
        console.log('emailSentSuccessfully: ', emailSentSuccessfully);
        console.log('emailNotRegistered: ', emailNotRegistered);
        if (emailSentSuccessfully){
          facebook.sendTextMessage(senderID,bdostTxt.MTStepOneOk,fd.db);
        } else if (emailNotRegistered) {
          facebook.sendLink(senderID,bdostTxt.MTNotRegistered,bdostTxt.MTNewRegisterButton,bdostTxt.MTNewRegisterUrl,fd.db);
        }
        resolve(body);
      });
    });
    // handle connection errors of the request
    request.on('error', (err) => reject(err))
    })
};

function randomIntInc (low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
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
      variables       :{
        questionOne   : "",
        questionTwo   : "",
        questionThree : "",
        questionFour  : ""
      },
      firstSubVar     :"",
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
function getDistrict(message){
  var sentence = manuelLowerCase(message);
  var distance = '';
  var closest  = 50;
  var district = '';

  // read json file.
  var districts = JSON.parse(fs.readFileSync(__dirname + bdostTxt.districts));

  for(var i=0; i < districts.istanbul.length; i++){

    distance = levenshtein.get(manuelLowerCase(districts.istanbul[i].district), sentence, { useCollator: true});
    
    // if district has an alias, check them all as well.
    if(districts.istanbul[i].alias){
      for(var j=0; j<districts.istanbul[i].alias.length; j++){
        distance = levenshtein.get(manuelLowerCase(districts.istanbul[i].alias[j]), sentence, { useCollator: true});
        if(distance < closest){
          closest = distance;
          district = districts.istanbul[i].district;
        }
      }
    }

    if(distance < closest){
      closest = distance;
      district = districts.istanbul[i].district;
    }
  }

  if(closest > 2){
    district = "";
  }
  
  return district;
}
function getCityCode(message){
  var cities = JSON.parse(fs.readFileSync(__dirname + bdostTxt.cities));

  for(var i=0; i < cities.trCities.length; i++){
    if(cities.trCities[i].city === message){
      return cities.trCities[i].cityCode;
    }
  }
}
function getDistrictCode(message){
  var district = JSON.parse(fs.readFileSync(__dirname + bdostTxt.districts));

  for(var i=0; i < district.istanbul.length; i++){
    if(district.istanbul[i].district === message){
      return district.istanbul[i].districtCode;
    }
  }
}

function checkEmail(message){
    var validEmailForm = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return validEmailForm.test(message);
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
  
  findOrCreateProcess(senderID);

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
  
  setBotStatus(senderID, fd.botStatus);
}

// flow functions
function stepOne(senderID, messageText){
  var sessionUser     = findOrCreateSession(senderID);
  var fd              = sessions[sessionUser].context;

  if(fd.step === 0){
    fd.activeProcess = "pOne";
    fd.db     = "modelOne";
    fd.dbStep = true;
    facebook.sendModelOneCTA(senderID,fd.db);
  }

  if(fd.step === 1  || fd.firstVar === ""){
    if(fd.step === 2){ fd.dbStep = false;}
    
    console.log("fdstep:"+fd.step);
    fd.step = 1;
    fd.firstVar = getExpression(messageText);
    console.log(fd.firstVar);
    
    if(fd.firstVar){
      if(fd.firstVar === "Evet"){
        fd.step = 2;
      }
    }        
  }

  if(fd.step === 2 && fd.variables.questionOne === ""){
    facebook.sendTextMessage(senderID,"Telefonu ne için kullanmayı seviyorsunuz?",fd.db);
    fd.variables.questionOne = messageText;
    
    if(fd.variables.quesionOne === ""){
      fd.step = 1;
    }
  }

  if(fd.step === 3 && fd.variables.questionTwo === ""){
    facebook.sendTextMessage(senderID,"Sizin için en önemli özellik nedir?",fd.db);
    fd.variables.questionTwo = messageText;
    if(fd.variables.questionTwo === ""){
      fd.step = 2;
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
exports.setBotStatus          = setBotStatus;
exports.clearSessionVariables = clearSessionVariables;
exports.clearSessionProcesses = clearSessionProcesses;
exports.getActiveUser         = getActiveUser;

exports.stepOne               = stepOne;
exports.stepPlus              = stepPlus;

exports.stepGreeting          = stepGreeting;
exports.stepExit              = stepExit;
exports.stepNotRecognized     = stepNotRecognized;
exports.stepRunAgain          = stepRunAgain;