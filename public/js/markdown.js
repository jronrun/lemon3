/**
 *
 */
var MarkdownIt = require('markdown-it'),
  MarkdownItFootnote = require('markdown-it-footnote');

var helper = function (inst, options) {
  options = options || {};
  var tools = {
    target: inst,

    render: function (src, env, theme) {
      var markedHtml = inst.render(src, env);

      if (null != options.output && $(options.output).length) {
        $(options.output).html(markedHtml);
        tools.features(theme);
      }

      return markedHtml;
    },

    features: function (theme, mirror, rootElSelector) {
      var aMirror = mirror || options.mirror,
        inRoot = function (subSelector) {
          var rootEl = rootElSelector || options.output || '';
          return lemon.isBlank(rootEl) ? subSelector : (rootEl + ' ' + subSelector);
        };

      if (!lemon.isBlank(aMirror)) {
        $(inRoot('pre.mirror-hl')).each(function () {
          var info = lemon.data(this), thiz = this;
          aMirror.highlights({
            input: lemon.unescape(info.code),
            mode: info.lang,
            theme: theme || 'lemon',
            resultHandle: function (ret) {
              $(thiz).html(ret);
            }
          });
        });
      }

      $(inRoot('blockquote')).addClass('blockquote');
      $(inRoot('table')).addClass('table table-hover table-sm');

      return true;
    }
  };

  return tools;
};

var markdown = function (options, markdownOptions) {
  options = lemon.extend({
    output: null,
    mirror: null
  }, options || {});

  markdownOptions = lemon.extend({
    html:         true,         // Enable HTML tags in source
    xhtmlOut:     false,        // Use '/' to close single tags (<br />).
                                // This is only for full CommonMark compatibility.
    breaks:       false,        // Convert '\n' in paragraphs into <br>
    langPrefix:   'language-',  // CSS language prefix for fenced blocks. Can be
                                // useful for external highlighters.
    linkify:      true,         // Autoconvert URL-like text to links

    // Enable some language-neutral replacement + quotes beautification
    typographer:  true,

    // Double + single quotes replacement pairs, when typographer enabled,
    // and smartquotes on. Could be either a String or an Array.
    //
    // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
    // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
    quotes: '“”‘’',

    // Highlighter function. Should return escaped HTML,
    // or '' if the source string is not changed and should be escaped externaly.
    // If result starts with <pre... internal wrapper is skipped.
    //highlight: function (/*str, lang*/) { return ''; }
    highlight: null
  }, markdownOptions || {});

  var inst = MarkdownIt(markdownOptions).use(MarkdownItFootnote);

  //highlight using codemirror
  if (null == markdownOptions.highlight && null != options.mirror) {
    inst.options.highlight = function (code, lang) {
      var theTmpl = '<pre class="mirror-hl" data-lang="<%= lemon.enc(lang) %>" data-code="<%= lemon.enc(code)%>"><code><%=code %></code></pre>';
      return lemon.tmpl(theTmpl, {
        lang: lang || 'text',
        code: inst.utils.escapeHtml(code)
      });
    }
  }

  return helper(inst, options);
};


module.exports = markdown;
