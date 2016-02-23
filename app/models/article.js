// Example model

var log = log_from('article');

function Article (opts) {
  if(!opts) opts = {};
  this.title = opts.title || '';
  this.url = opts.url || '';
  this.text = opts.text || '';
}

module.exports = Article;

