
!function ($) {

    "use strict";


    /* HYPERMEDIA RELOAD PUBLIC CLASS DEFINITION
     * ============================== */

    var HypermediaReload = function (element, options) {
        this.$element = $(element);
        this.options = $.extend({}, $.fn.hypermediareload.defaults, options);
    }

    HypermediaReload.prototype = {

        reload: function (data) {
            var remote = data.remote || this.options.remote;

            if (remote) return document.location = remote;

            $.userdata.set('scrollposition', this.getPageScroll());

            window.location = this.getSelfLink(data._links) || window.location;
        }

      , getPageScroll: function () {
          if (document.documentElement && document.documentElement.scrollTop) {
              return document.documentElement.scrollTop;
          }

          if (document.body) {
              return document.body.scrollTop;
          }

          return 0;
      }

      , getSelfLink: function (links) {
          if (links && links.self) return links.self[0].href;
      }

    };


    /* REMOTE LOAD PLUGIN DEFINITION
     * ======================== */

    var hypermediareload = $.fn.hypermediareload;

    $.fn.hypermediareload = function (option, hypermedia) {
        return this.each(function () {
            var $this = $(this)
              , data = $this.data('hypermediareload')
              , options = $.extend({}, $.fn.hypermediareload.defaults, $this.data(), typeof option == 'object' && option);

            if (!data) $this.data('hypermediareload', (data = new HypermediaReload(this, options)));

            if (typeof option == 'string') data[option || 'reload'](hypermedia);
        });
    }

    $.fn.hypermediareload.defaults = {
    }

    $.fn.hypermediareload.Constructor = HypermediaReload;


    /* HYPERMEDIA RELOAD NO CONFLICT
     * ================== */

    $.fn.hypermediareload.noConflict = function () {
        $.fn.hypermediareload = old;

        return this;
    }


    /* HYPERMEDIA RELOAD DATA-API
     * =============== */

    $(function () {

        if ($.userdata != undefined)
          window.scroll(0, $.userdata.get('scrollposition', true));

    });

    $(window).on('load', function () {

        $(document)
          .on('reload.hypermediareload.data-api', '[data-action="reload"]', function (e) {
              $(e.target).hypermediareload('reload', e);
          });

    });

}(window.jQuery);