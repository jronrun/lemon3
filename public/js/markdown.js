/**
 *
 */
var MarkdownIt = require('markdown-it'),
  MarkdownItFootnote = require('markdown-it-footnote'),
  MarkdownItTocAndAnchor = require('markdown-it-toc-and-anchor/src/index').default;

require('../css/markdown.styl');

var anchorLinkSymbol = '<svg aria-hidden="true" class="octicon octicon-link" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg>';
var helper = function (inst, options) {
  options = options || {};
  var tools = {
    target: inst,

    render: function (src, env, theme) {
      var markedHtml = inst.render(src, env);

      if (null != options.output && $(options.output).length) {
        $(options.output).html([
          '<article class="markdown-body">',
          markedHtml,
          '</article>'
        ].join('\n'));

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

      $(inRoot('a.anchor')).html(anchorLinkSymbol);
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

  var inst = MarkdownIt(markdownOptions)
    .use(MarkdownItFootnote)
    .use(MarkdownItTocAndAnchor, {
      anchorClassName: 'anchor',
      anchorLinkSymbol: ''
    });

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
