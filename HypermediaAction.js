
!function ($) {

    "use strict";


    function handleServerError($form, response) {
        if (response !== undefined) {
            if ($('#error-modal') !== undefined) {
                $('#error-modal-body').html(response);
	            $('#error-modal').modal('toggle');
            }
        }
    }


    /* HYPERMEDIA ACTIONS PUBLIC CLASS DEFINITION
     * ============================== */

	//MB I have extended the jQuery prototype directly here, this should really be provided by a plugin
	$.fn.hypermediatarget = function () { return $(this.data("target")); };

	$.fn.refresh = function () {
		if ($(this).data("refresh"))
			$($(this).data("refresh")).hypermediaload();
	};

	$.fn.refreshmany = function () {
		if ($(this).data("refreshmany")) {
			var targets = $(this).data("refreshmany").targets;
			$(targets).each(function () { $(this.toString()).hypermediaload(); });
		}
	};

	$.fn.updatedynamiccontainer = function () {
		if ($(this).data("type") === "dynamic-container") {
			$(this).find('a[data-action="hypermedia"][data-loadme]').hypermediaaction('act');
			$(this).find('div[data-action="loadme"]').each(function () { $(this).hypermediaload(); });
			$(this).trigger('dynamic-update');
		}
	};

	$.fn.hypermedialoadmodalbody = function (url) {
		$(this).load(url, function () { $(this).trigger('update'); });
	};

	$.fn.hypermediaload = function () {
		if ($(this).data("remote"))
            $(this).load($(this).data("remote"), function () { $(this).updatedynamiccontainer(); });
		return $(this);
    }


	
    var HypermediaAction = function (element, options) {
        this.$element = $(element);

        this.options = $.extend({}, $.fn.hypermediaaction.defaults, options);

        this.$hypermedia = this.findHypermediaElement() || this.$element;
    }

	
    HypermediaAction.prototype = {
        act: function () {
            var fileUpload = $(this.$element[0]).attr('enctype') === "multipart/form-data";

            var that = this,
                form = this.$element[0],
                method = (this.options.restful && form._method && form._method.value) || form.method || 'GET',
                etag = (form.ETag && form.ETag.value) || '',
                data = (fileUpload ? new FormData(this.$element[0]) : this.$element.serializeArray());

            if (fileUpload) {
                $.ajax({ url: form.action || form.href, type: 'POST', data: data, contentType: false, processData: false })
                    .done($.proxy(that.done, that))
                    .fail($.proxy(that.fail, that));
            } else {
                $.ajax(form.action || form.href, { method: method, data: data })
                    .done($.proxy(that.done, that))
                    .fail($.proxy(that.fail, that));
            }

            this.$btn = this.$element.find('[type=submit]').button('loading');

            return this;
        }

      , findHypermediaElement: function () {
          var that = this
            , hm = $(this.options.hypermedia || '[data-hypermedia="' + this.options.parent + '"]');

          return $(hm.filter(function () { return $.contains(this, that.$element); })[0]);
      }

        , done: function (data, textStatus, jqXHR) {

          var forceLocation = $(data).find('a[data-force-location]');
          if (forceLocation.length === 1 && forceLocation.attr('href') !== undefined)
              window.location.href = forceLocation.attr('href');
          else {
              this.etagNotify(jqXHR);
	          this.refreshTarget(data);
              this.updateTarget(data);
              this.complete('complete', textStatus, data);   
          }
            // this.$element.logToLogger('complete', jqXHR.status, §textStatus, jqXHR.responseText, data);
        }

      , fail: function (jqXHR, textStatus, errorThrown) {
          this.$btn.button('reset');

          this.complete('fail', textStatus, jqXHR.responseText);

          handleServerError(this.$element, jqXHR.responseText);
      }

      , etagNotify: function (jqXHR) {
          var etag = (this.$element[0].ETag || { value: null }).value;

          if (etag) {
              var e = $.Event('etagupdate', {
                  from: etag
                , to: jqXHR.getResponseHeader('ETag')
              });

              this.$element.trigger(e);
          }
      }

      , updateTarget: function (data) {
          if (this.options.remote || !this.options.target) {
              this.$element.trigger($.Event('reload', data));
          }

          var $target = $(this.options.target)
            , $data = $(data);

          if (this.options.filter) {
              var $filtered = $data.filter(this.options.filter);

              if ($filtered.is(this.options.filter)) {
                  $data = $filtered;
              }
          }

          $target.html($data);

          $target.trigger($.Event('update', { response: data }));

          this.$btn.button('reset');
      }
        , refreshTarget: function (data) {
            if (this.options.refresh === undefined)
                return;

	        var $target = $(this.options.refresh);

	        if ($target.is('form') || $target.is('a')) {
		        $target.hypermediaaction('act');
            }

	        if ($target.is('div')) {
		        $target.hypermediaload();
	        }

	        $target.trigger($.Event('update', { response: data }));
        }

      , complete: function (type, textStatus, data) {
          var option = textStatus.toLowerCase();

          this.options[option] && this.options[option](textStatus, data);
          this.options[type] && this.options[type](textStatus, data);
      }
      , target: function() {
            return $(this.data("target"));
      }
      , refresh: function () {

	        return $(this.data("refresh"));
        }
    }


    /* HYPERMEDIA ACTIONS PLUGIN DEFINITION
     * ======================== */

    var old = $.fn.hypermediaaction;


	//extend the jquery prototype to plugin in the HypermediaAction object
    $.fn.hypermediaaction = function (option) {
        return this.each(function () {
            var $this = $(this)
              , data = $this.data('hypermediaaction')
              , options = $.extend({}, $.fn.modal.defaults, $this.data(), typeof option == 'object' && option);

            if (!data) $this.data('hypermediaaction', (data = new HypermediaAction(this, options)));

            if (option === 'act') data.act();
        });
    }

    $.fn.hypermediaaction.defaults = {
        restful: false
    }

    $.fn.hypermediaaction.Constructor = HypermediaAction;


    /* HYPERMEDIA ACTIONS NO CONFLICT
     * ================== */

    $.fn.hypermediaaction.noConflict = function () {
        $.fn.hypermediaaction = old;

        return this;
    }


    /* HYPERMEDIA ACTIONS DATA-API
     * =============== */

    $(window).on('load', function () {

		//catch http request events on hypermedia elements, and call hypermedia functionality
        $(document)
          .on('submit.hypermediaaction.data-api', 'form[data-action="hypermedia"]', function (e) {
              e.preventDefault();

              $(e.target).hypermediaaction('act');
          })
          .on('click.hypermediaaction.data-api', 'a[data-action="hypermedia"]', function (e) {
              e.preventDefault();

              $(e.target).hypermediaaction('act');
          });

    });

}(window.jQuery);
