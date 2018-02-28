!function ($) {

	"use strict";

	//public class definition
	var HypermediaAutoSave = function (element, options) {
		this.$element = $(element);
		this.options = $.extend({}, $.fn.hypermediaautosave.defaults, options);
		this.timeout = function () {};
	}

	//autosave prototype definition
	HypermediaAutoSave.prototype = {
		act: function() {

			clearTimeout(this.timeout); //clear the delay save

			var input = this.$element;

			if (input.data('post-form')) {
				if (input.val().length === 0)
					$(input.data('delete-form')).hypermediaaction('act');
				else
					$(input.data('post-form')).hypermediaaction('act');
			}
			else 
			{ 
				$(input.closest('form')).hypermediaaction('act');
			}
		},
		delay: function() {

			clearTimeout(this.timeout); //clear the delay save

			var me = this;

			this.timeout = setTimeout(function () {
				me.act();
			}, 3000);
		}
		
	};

	var old = $.fn.hypermediaautosave;

	//extend jquery prototype to plug in autosave object
	$.fn.hypermediaautosave = function (option) {
		 return this.each(function () {
			 var $this = $(this)
				 , data = $this.data('hypermediaautosave')
				 , options = $.extend({}, $.fn.hypermediaautosave.defaults, $this.data(), typeof option == 'object' && option);

			 if (!data) $this.data('hypermediaautosave', (data = new HypermediaAutoSave(this, options)));

			 if (option === 'act') data.act();

			 if (option === 'delay') data.delay();
		 });
	 }

	$.fn.hypermediaautosave.defaults = {}

	$.fn.hypermediaautosave.Constructor = HypermediaAutoSave;

	 //no conflict
	$.fn.hypermediaautosave.noConflict = function () {
		$.fn.hypermediaautosave = old;
		return this;
	}

	 //plug into dom events
	 $(window).on('load', function () {

		 $(document)
			 .on("keyup", "[data-action='auto-save']", function (e) {
				 e.preventDefault();
				 $(e.target).hypermediaautosave('delay');
			 })
			 .on("change", "[data-action='auto-save']", function (e) {
				 e.preventDefault();
				 $(e.target).hypermediaautosave('act');
			 });
	 });

 }(window.jQuery);

