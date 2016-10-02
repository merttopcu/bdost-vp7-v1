'use strict'

var productName 			= "VodafoneDost";
exports.productName			= productName;

exports.txtGreeting 		= function(username){ return "Merhaba "+ username + ", ben "+productName+". Size aşağıdaki konular ile ilgili yardımcı olabilirim;"};

exports.txtConfused			= "Sana aşağıdaki konular ile ilgili yardımcı olabilirim.";
exports.txtAttachment   	= "Üzgünüm, ekli dosyaları ya da emoji ikonlarını ne yazık ki henüz okuyamıyorum. Benim yardımcı olmamı istediğin konuyu yazılı gönderebilirsin.";
exports.txtAgain			= productName +" tekrar iş başında :)";
exports.txtBye		 		= "Görüşmek üzere... :)";

// 2 + 1 model
exports.modelOne	 		= "Telefon Modelleri";
exports.modelPlus	 		= "Yetkili İle Görüş";

//----------------- Model One -----------------
exports.MOWelcome  			= "Süper, size uygun telefon modellerini yönlendirebilmek için bazı sorular soracağım. Hazır mısınız?";
exports.MOCTA               = "Evet";

exports.MOContinue 			= "Öncelikle bana hangi ilde iş aradığını söyler misin?";
exports.MOStepOne  			= function(firstVar){
	return "Tamam, "+ firstVar +" için iş arıyorsun. Peki ilgilendiğin mesleği yazar mısın?";
}
exports.MOStepTwo  			= function(firstVar,secondVar){
	return firstVar +", "+ secondVar +" için ilk 5 ilana bakıyorum.";
}

exports.MOStepSubOne  		= function(firstVar){
	return "Tamam, "+ firstVar +" için iş arıyorsun. Peki hangi ilçede iş aradığını söyler misin?";
}
exports.MOStepSubCont  		= function(firstVar,firstSubVar){
	return "Tamam, "+ firstSubVar +", " + firstVar +" için iş arıyorsun. Peki ilgilendiğin mesleği yazar mısın?";
}
exports.MOSubContinue 		= "Öncelikle bana hangi ilçede iş aradığını söyler misin?";

exports.MOEnd      			= "Tüm iş ilanları ve başvuru için adres aşağıda. Kariyerinizde başarılar dilerim.";
exports.MOEndButton         = "Tüm İş İlanları"
exports.MOFailure  			= "Ozur dilerim ama aramaniz sonuc vermedi. Isterseniz 'İş Arıyorum' yazarak tekrar deneyebilirsiniz.";

//----------------- Model Plus -----------------
exports.MPWelcome  			= "Sizi yetkili danışmana aktarıyorum. En kısa zamanda sizinle facebook üzerinden iletişime geçecekler."
exports.MPContinue 			= "Ama isterseniz, "+productName+" ile konuşmaya devam edebilirsiniz.";


//----------------- Models' Keywords -----------------
exports.modelOneKeywords  	= "/grammar/trTR-phone-models";
exports.modelPlusKeywords 	= "/grammar/trTR-authorized";

exports.greetingKeywords 	= "/grammar/trTR-greeting";
exports.exitKeywords	  	= "/grammar/trTR-thanking";
exports.reRunKeywords    	= "/grammar/trTR-run";

exports.cities 			   	= "/grammar/trTR-cities";
exports.districts 		   	= "/grammar/trTR-cities-istanbul";