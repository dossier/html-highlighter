/**
 * @file HTML Highlighter example.
 * @copyright 2015 Diffeo
 *
 * Comments:
 *
 */


require( [ 'jquery', 'src/html_highlighter' ], function ($, hh) {
  return MainModule(window, $, hh);
} );


var MainModule = function (window, $, hh, undefined) {

  var dataBaseUrl = 'data/',
      dataSources = [ {
        name: 'Viber hacked',
        url: 'viber-attacked-by-syrian-electronic-army.json'
      }, {
        name: 'Simple',
        url: 'simple.json'
      }, {
        name: 'One paragraph',
        url: 'one-para.json'
      } ];

  var elSelector = $('#filter-data'),
      elDocument = $('#document'),
      elWidgetSelection = $('#widget-selection'),
      elWidgetMain = $('#widget-main'),
      elSearch = $('#search'),
      elAdd = $('#add');

  var count = 0,
      mouseDown = 0,
      highlighter;


  function init()
  {
    /* Set-up sequence
     * --
     * UI */
    elSelector.change(function () {
      highlighter.clear();
      elDocument.html(dataSources[parseInt($(this).val())]
                      .content.body.clean_html);
      highlighter.refresh();
      elSearch.focus();
    } );

    elSearch.keyup(function () {
      elAdd.attr('disabled', elSearch.val().trim().length === 0);
    } );
    elSearch.val('').trigger('keyup').focus();

    elAdd.click(function () {
      var name = elSearch.val();
      highlighter.add(name, [ name ]);
      elSearch.select().focus();
    } );

    elSelector
      .children().remove()
      .change(function () {
        load(parseInt(elSelector.val()));
      } );

    var timeout = null;
    $(window).on( {
      mouseup: function () {
        -- mouseDown;

        /* Process text selection with a delay to ensure accurate results. */
        if(timeout !== null) window.clearTimeout(timeout);
        timeout = window.setTimeout(function () {
          timeout = null;
          if(mouseDown !== 0) return;

          var range = highlighter.getSelectedRange();
          if(range === null) {
            elWidgetSelection.removeClass('enabled');
            return;
          }

          elWidgetSelection.find('.offset').text(
            range.start.marker.offset
              + '(' + range.start.offset + ')'
              + ':' + range.end.marker.offset
              + '(' + range.end.offset + ')');

          var hit,
              xpath = range.computeXpath(elDocument),
              finder = new hh.HtmlXpathFinder(highlighter.content, xpath);

          elWidgetSelection.find('.xpath')
            .text(xpath.xpath + ':' + xpath.start + ':' + xpath.end);

          if((hit = finder.next()) !== false)
            new hh.HtmlRangeHighlighter(5).do(hit);

          highlighter.clearSelectedRange();
          elWidgetSelection.addClass('enabled');
        }, 150);
      },
      mousedown: function () {
        ++ mouseDown;
      }
    } );

    /* Done setting up.  Now load mock data. */
    var next = function (i) {
      if(i >= dataSources.length) {
        load(0);

        highlighter = new hh.HtmlHighlighter( {
          container: elDocument,
          widget: elWidgetMain,
          maxHighlight: 5
        } );
        return;
      }

      var d = dataSources[i];
      require( [ dataBaseUrl + d.url + '?' ], function (result) {
        /* Note: due to obvious constraints imposed on loading of local system
         * resources (via file://), data source files are required to export the
         * global variable `g_descriptor´. */
        if(g_descriptor !== undefined) {
          elSelector.append($('<option/>').attr('value', i).html(d.name));
          d.content = g_descriptor;
          g_descriptor = null;
          ++i;
        } else
          dataSources.splice(i, 1);

        next(i);
      } );
    };

    next(0);
  }

  function load(index)
  {
    elDocument.html(dataSources[index].content.body.clean_html);
  }


  /* Initialise module */
  init();

};