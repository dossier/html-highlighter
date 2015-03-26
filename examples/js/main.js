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
        name: 'One paragraph',
        url: 'one-para.json'
      } ];

  var elSelector = $('#filter-data'),
      elDocument = $('#document'),
      elWidget = $('#widget'),
      elSearch = $('#search'),
      elAdd = $('#add');

  var count = 0,
      highlighter;


  function init()
  {
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
      var name = 'search#' + ++count;
      console.log('Creating search query: name=%s | query=%s',
                  name,
                  elSearch.val());

      highlighter.add(name, [ elSearch.val() ]);
      elSearch.select().focus();
    } );

    elSelector
      .children().remove()
      .change(function () {
        load(parseInt(elSelector.val()));
      } );

    /* Now actually load mock data. */
    var next = function (i) {
      if(i >= dataSources.length) {
        load(0);

        highlighter = new hh.HtmlHighlighter( {
          container: elDocument,
          widget: elWidget,
          maxHighlight: 5
        } );
        return;
      }

      var d = dataSources[i];
      elSelector.append($('<option/>').attr('value', i).html(d.name));

      require( [ dataBaseUrl + d.url + '?' ], function (result) {
        /* Note: due to obvious constraints imposed on loading of local system
         * resources (via file://), data source files are required to export the
         * global variable `g_descriptor´. */
        if(g_descriptor !== undefined) {
          d.content = g_descriptor;
          delete g_descriptor;
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