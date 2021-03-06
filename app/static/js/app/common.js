
'use strict';

// From http://detectmobilebrowsers.com
(function detectMobile (a,b){
	if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) {
		window._isMobile = true;
		document.body.className += ' mobile';
		return true;
	}
	window._isMobile = false;
	return false;
})(navigator.userAgent||navigator.vendor||window.opera);

// classList shim
// https://gist.github.com/devongovett/1381839
if (!("classList" in document.documentElement)&&Object.defineProperty&&typeof HTMLElement!=='undefined') {
	Object.defineProperty(HTMLElement.prototype,"classList",{get:function(){function n(n){return function(e){var s=t.className.split(/\s+/),i=s.indexOf(e);n(s,i,e),t.className=s.join(" ")}}var t=this,e={add:n(function(n,t,e){~t||n.push(e)}),remove:n(function(n,t){~t&&n.splice(t,1)}),toggle:n(function(n,t,e){~t?n.splice(t,1):n.push(e)}),contains:function(n){return!!~t.className.split(/\s+/).indexOf(n)},item:function(n){return t.className.split(/\s+/)[n]||null}};return Object.defineProperty(e,"length",{get:function(){return t.className.split(/\s+/).length}}),e}});
}


setTimeout(function updateCounters () {
	$('[data-time-count]').each(function () {
		this.innerHTML = calcTimeFrom(parseInt(this.dataset.timeCount), this.dataset.short !== 'false');
	});
	setTimeout(updateCounters, 30*1000);
}, 1000);

// Globals

window.calcTimeFrom = function (arg, short) {
	var now = new Date(),
		then = new Date(arg),
		diff = now-then;

	if (diff < 1000*60) {
		return 'agora';
	} else if (diff < 1000*60*60) {
		var m = Math.floor(diff/1000/60);
		return short?('há '+m+'m'):('há '+m+' minuto'+(m>1?'s':''));
	} else if (diff < 1000*60*60*30) { // até 30 horas
		var m = Math.floor(diff/1000/60/60);
		return short?('há '+m+'h'):('há '+m+' hora'+(m>1?'s':''));
	} else if (diff < 1000*60*60*24*14) {
		var m = Math.floor(diff/1000/60/60/24);
		return short?('há '+m+'d'):('há '+m+' dia'+(m>1?'s':''));
	} else {
		var m = Math.floor(diff/1000/60/60/24/7);
		return short?('há '+m+'sem'):('há '+m+' semana'+(m>1?'s':''));
	}
};

window.formatFullDate = function (date) {
	date = new Date(date);
	return ''+date.getDate()+' de '+['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio',
	'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro',
	'Dezembro'][date.getMonth()]+', '+date.getFullYear()+' '+(date.getHours()>12?
		''+(date.getHours()-12)+':'+date.getMinutes()+'pm':
		''+(date.getHours())+':'+date.getMinutes()+'am');
};
// Plugins and defaults

require('es5-shim');
require('es6-shim');

var $ = require('jquery');
require('modernizr');
require('autosize');

require('../vendor/bootstrap/tooltip.js');
require('../vendor/bootstrap/button.js');
require('../vendor/bootstrap/dropdown.js');

$('body').tooltip({selector:'[data-toggle=tooltip]'});
$('.btn').button();

(function setCSRFToken () {
	$.ajaxPrefilter(function(options, _, xhr) {
		if (!options.crossDomain) {
			xhr.setRequestHeader('csrf-token', $('meta[name=\'csrf-token\']').attr('content'));
		}
	});
})();

$('.autosize').autosize();

// GOSTAVA TANTO DE NUTELLA

// Simple post forms as links
$('a[data-ajax-post-href],button[data-ajax-post-href]').click(function () {
	var href = this.dataset['ajaxPostHref'],
		redirect = this.dataset['redirectHref'];
	$.post(href, function (data) {
		if (redirect)
			window.location.href = redirect;
		else
			window.location.reload();
	});
});


function bindProgressLoader() {
	var NProgress = require('nprogress')
	$(document).ajaxStart(function() {
		NProgress.start()
	});
	$(document).ajaxComplete(function() {
		NProgress.done()
	});
}

bindProgressLoader();



$('form[data-ajax-form=true]').submit(function (evt) {
	evt.preventDefault();

	var url = this.dataset['url'];
	var type = this.dataset['method'];
	var reload = this.dataset['reload'];
	var redirect = this.dataset['redirect'];

	console.assert(url && type, 'Invalid configuration of data-ajax-form.');

	$.ajax({
		url: url,
		type: type,
		data: $(this).serialize(),
		contentType: 'application/x-www-form-urlencoded',
	}).done(function (data) {
		if (data.flashMessage) {
			app.flash.info(data.flashMessage);
			// if (app && app.flash) {
			// }
		}
		if (redirect || data.redirectUrl) {
			window.location.href = redirect;
		}	else if (reload || data.reload) {
			window.location.reload();
		}
	}).fail(function (data) {
		app.flash.warn('WTF?');
	});
});