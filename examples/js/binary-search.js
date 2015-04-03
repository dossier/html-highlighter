var els, elo;
var coll;

function out(str)
{
  var text = elo.text();
  elo.text(text + (text.length > 0 ? '\n' : '') + str);
}

function init(count)
{
  var last = 0;

  coll = [];

  while(count -- > 0) {
    var val = Math.floor(Math.random() * (Math.floor(Math.random() * 900)
                                          + 100)) + last;
    coll.push(val);
    last = val;
  }

  $('#coll').text('length=' + coll.length + ', [ ' + coll.join(', ') + ' ]');
}

function search(val)
{
  out('> searching for ' + val);

  var c, mid,
      count = 0,
      min = 0,
      max = coll.length - 1;

  while(min < max) {
    if(++ count > Math.ceil(coll.length / 2)) {
      out('!aborting');
      return -1;
    }

    mid = Math.floor((min + max) / 2);
    c = coll[mid];

    out('$' + count + ': ' + c + ' ' + min + ' < ' + mid + ' < ' + max);

    if(c < val)
      min = mid + 1;
    else
      max = mid;
  }

  out('?' + count + ': ' + coll[min] + ' ' + min + ' < ' + mid + ' < ' + max);
  if(max == min && coll[min] == val)
    out('@' + min);
  else
    out('!not found');

  return min;
}

$(function () {
  els = $('#search');
  elo = $('#output');

  els.change(function () {
    search(els.val());
    els.focus();
    els.select();
  } ).focus();

  init(Math.random() * 90 + 10);
} );