//

JSON5 = require('json5');
var jju = require('jju/lib/parse');

var tabs = function(count) {
  return new Array(count + 1).join('\t');
};

var nextToken = function(tokens, curIdx) {
  tokens = tokens || [];
  var tkn = { raw: '', type: '', stack: [], value: ''}, tl = tokens.length, betnHasNL = 0;
  for (var idx = curIdx; idx < tl; idx++) {
    if (idx + 1 >= tl) {
      break;
    }
    tkn = tokens[idx + 1];
    if (tkn.type != 'whitespace' && tkn.type != 'newline') {
      break;
    } else if (tkn.type == 'newline') {
      ++betnHasNL;
    }
  }
  tkn.betnHasNL = betnHasNL;
  return tkn;
};

var prevToken = function(tokens, curIdx) {
  tokens = tokens || [];
  var tkn = { raw: '', type: '', stack: [], value: ''}, betnHasNL = 0;
  for (var idx = curIdx; idx > 0; idx--) {
    if (idx - 1 < 0) {
      break;
    }
    tkn = tokens[idx - 1];
    if (tkn.type != 'whitespace' && tkn.type != 'newline') {
      break;
    } else if (tkn.type == 'newline') {
      ++betnHasNL;
    }
  }
  tkn.betnHasNL = betnHasNL;
  return tkn;
};

var json5format = function(target) {
  var tokens = jju.tokenize(target), out = '', indent = 0;
  _.each(tokens, function (token, idx) {
    var sep = token.raw, nl = '\n', prev = null, next = null;
    switch (token.type) {
      case 'whitespace':
        break;
      case 'comment':
        prev = prevToken(tokens, idx);
        if ('comment' == prev.type) {
          out += tabs(indent);
        }
        if (/^\/\*/.test(sep)) {
          sep = sep.replace(/\n/g, nl + tabs(indent));
        }
        out += sep + nl;
        break;
      case 'key':
        prev = prevToken(tokens, idx);
        if ('comment' == prev.type) {
          out += tabs(indent);
        }
        out += sep;
        break;
      case 'literal':
        prev = prevToken(tokens, idx);
        if ('comment' == prev.type) {
          out += tabs(indent);
        }
        out += sep;
        break;
      case 'separator':
        if ('{' == sep || '[' == sep) {
          out += sep + nl + tabs(++indent)
        } else if ('}' == sep || ']' == sep) {
          out += nl + tabs(--indent) + sep;
        } else if (',' == sep) {
          next = nextToken(tokens, idx);
          out += sep;
          if (next.raw != '}' && next.raw != ']') {
            if (next.type == 'comment') {
              if (next.betnHasNL > 0) {
                out += nl;
              }
            } else {
              out += nl;
            }
          }
          out += tabs(indent);
          //out += sep + nl + tabs(indent);
        } else if (':' == sep) {
          out += sep + ' ';
        } else {
          out += sep;
        }
        break;
      case 'newline':
        break;
    }
  });

  return out;
};

module.exports = {
  tool: jju,
  format: function (target) {
    return json5format(target);
  }
};
