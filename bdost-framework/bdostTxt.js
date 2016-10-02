'use strict'

var productName 			= "Vodafone";
exports.productName			= productName;

exports.txtGreeting 		= function(username){ return "Merhaba "+ username + ", ben "+productName+". Sana yardım etmek için buradayım!"};
exports.txtSubGreeting 		= "Aşağıdaki seçeneklerden birini seçerek hizlica işlem yapabilirsin ;)";
exports.txtConfused			= "Sana aşağıdaki konular ile ilgili yardımcı olabilirim.";
exports.txtAttachment   	= "Üzgünüm, ekli dosyaları ya da emoji ikonlarını ne yazık ki henüz okuyamıyorum. Benim yardımcı olmamı istediğin konuyu yazılı gönderebilirsin.";
exports.txtAgain			= productName +" tekrar iş başında :)";
exports.txtBye		 		= "Kariyer hayatında başarılar dilerim. :)";

// 2 + 1 model
exports.modelOne	 		= "İş Arıyorum";
exports.modelTwo	 		= "Şifremi Unuttum :(";
exports.modelPlus	 		= "Yetkili Arıyorum";

//----------------- Model One -----------------
exports.MOWelcome  			= "Uygun iş fırsatlarını seninle paylaşıp, sana yardım etmek istiyorum.";
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

//----------------- Model Two -----------------
exports.MTWelcome  			= "Geçmiş olsun :( Merak etme hemen sana yardımcı olacağım. Kariyer.net hesabında kullandığın e-posta adresini yazar mısın?";
exports.MTStepOneOk			= "Süper! E-posta adresine şifre sıfırlama mailini gönderdim. Farklı bir sorun olursa her zaman buradan benimle iletişime geçebilirsin.";
exports.MTNotRegistered		= "Üzgünüm bu e-posta adresi ile kayıtlı bir kullanıcı bulamadım.";

exports.MTNewRegister		= "Ama istersen bu e-posta adresi ile yeni üyelik yaratabilirsin. Hemen denemek ister misin?";
exports.MTNewRegisterButton = "Yeni Üyelik";
exports.MTNewRegisterUrl    = "http://www.kariyer.net/WebSite/Kariyerim/UyeOl.aspx";

exports.MTStepOneFail		= "E-posta adresini tam anlayamadım ama sana yardımcı olmak için, aşağıdaki linki oluşturdum. Bu adrese tıklayarak, şifreni sıfırlayıp, yeni şifre oluşturabilirsin.";
exports.MTFailButton		= "Şifre Sıfırlama";
exports.MTFailUrl			= "http://www.kariyer.net/website/teknikdestek/sifremiunuttum/s1.aspx";

//----------------- Model Plus -----------------
exports.MPWelcome  			= "Tabii ki, sizi yetkili arkadaşıma yönlendiriyorum. Sizinle en kısa zamanda, yine Facebook Messenger üzerinden iletişime geçecektir."
exports.MPContinue 			= "Ama isterseniz, "+productName+" ile konuşmaya devam edebilirsiniz.";


//----------------- Models' Keywords -----------------
exports.modelOneKeywords  	= "/grammar/trTR-job-search";
exports.modelTwoKeywords  	= "/grammar/trTR-forget-password";
exports.modelPlusKeywords 	= "/grammar/trTR-authorized";

exports.greetingKeywords 	= "/grammar/trTR-greeting";
exports.exitKeywords	  	= "/grammar/trTR-thanking";
exports.reRunKeywords    	= "/grammar/trTR-run";

exports.cities 			   	= "/grammar/trTR-cities";
exports.districts 		   	= "/grammar/trTR-cities-istanbul";