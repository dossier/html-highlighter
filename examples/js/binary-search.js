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

  var c,
      count = 0,
      i = Math.ceil(coll.length / 2),
      ndx = i;

  out('0: (' + coll[ndx] + ') $' + i + ' = ' + ndx);

  while(true) {
    ++count;

    c = coll[ndx];
    i = Math.max(1, Math.floor(i / 2));

    if(i === 0) {
      ndx = null;
      break;
    }

    if(c < val) {
      ndx += i;
      out(count + ': (' + coll[ndx] + ') +' + i + ' = ' + ndx);
    } else if(c > val) {
      ndx -= i;
      out(count + ': (' + coll[ndx] + ') -' + i + ' = ' + ndx);
    } else
      break;
  }

  if(ndx === null)
    out('!not found');
  else
    out('@' + ndx);

  return ndx;
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