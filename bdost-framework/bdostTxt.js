'use strict'

var productName 			= "VodafoneDost";
exports.productName			= productName;

exports.txtGreeting 		= function(username){ return "Merhaba "+ username + ", ben "+productName+". Size aşağıdaki konular ile ilgili yardımcı olabilirim;"};

exports.txtConfused			= "Size aşağıdaki konular ile ilgili yardımcı olabilirim.";
exports.txtAttachment   	= "Üzgünüm, ekli dosyaları ya da emoji ikonlarını ne yazık ki henüz okuyamıyorum. Benim yardımcı olmamı istediğin konuyu yazılı gönderebilirsin.";
exports.txtAgain			= productName +" tekrar iş başında :)";
exports.txtBye		 		= "Görüşmek üzere... :)";

// 2 + 1 model
exports.modelOne	 		= "Telefon Modelleri";
exports.modelPlus	 		= "Tarifeler";

//----------------- Model One -----------------
exports.MOWelcome  			= "Süper, size uygun telefon modellerini yönlendirebilmek için bazı sorular soracağım. Hazır mısınız?";
exports.MOCTA               = "Evet";
exports.MOCTAn              = "Hayır";

exports.MOEnd      			= "Yeniden denemek ister misiniz?";
exports.MOResult            = "Tüm seçimlerinize göre size uygun telefonları inceliyorum.";
exports.MOSearchMessage     = "Size uygun telefonları aşağıda listeliyorum.";
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

exports.expressions 		= "/grammar/trTR-expressions";
exports.questions	 		= "/grammar/trTR-questions";