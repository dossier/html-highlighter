require( [ 'jquery' ], function ($) {
  return MainModule(window, $);
} );


MainModule = function (window, $, undefined) {

  var dataBaseUrl = 'data/',
      dataSources = [ {
        name: 'Viber hacked',
        url: 'viber-attacked-by-syrian-electronic-army.json?'
      } ];

  var elSelector = $('#filter-data'),
      elDocument = $('#document'),
      elWidget = $('#widget');


  function init()
  {
    elSelector
      .children().remove()
      .change(function () {
        load(parseInt(elSelector.val()));
      } );

    /* Now actually load mock data. */
    var next = function (i) {
      if(i >= dataSources.length) {
        load(0);
        return;
      }

      var d = dataSources[i];
      elSelector.append($('<option/>').attr('value', i).html(d.name));

      require( [ dataBaseUrl + d.url ], function (result) {
        if(g_descriptor !== undefined) {
          d.content = g_descriptor;
          g_descriptor = undefined;
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