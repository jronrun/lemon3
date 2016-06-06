'use strict';

var log = log_from('forms'),
  GenerateSchema = require('generate-schema');

var formOptions = {
  formEl: 1,                  //form tag, 0 none form element tag, 1 output form tag, default is 1
  buttons: [],                //{formElement}
  attrs: {}                   //html form element attributes or any custom attributes
};

var formElement = {
  el: 'input',      //html element type, input|fieldset|button|select|textarea|radio|checkbox
  attrs: {          //html element attributes or any custom attributes
    id: '',         //eg: a-b-c0-test
    name: '',       //eg: a.b.c[0].test
    shortname: '',  //test
    type: '',       //eg: input type, hidden|text
    placeholder: '',
    required: 'required',
    readonly: 'readonly',
    checked: 'checked',
    disabled: 'disabled'
  },

  child: {          //form fieldset if el is fieldset
    layout: {},     //{formOptions}
    items: []       //{formElement} array
  },

  options: [      //options if select, checkbox, radios
    {
      tip: '',        //option show text
      val: '',        //option value
      desc: '',       //option desc
      selected: 0     //0|1, 1 selected
    }
  ],
  selected: '',  //value|array, default selected if select, checkbox, radios
  inline: 0,     //is inline show if element is (radio,checkbox) , 0 false, 1 true

  parent: '',     //parent field name if defind type is 'object' or 'array'
  label: '',      //html element label
  value: '',      //html element value if element is not (select, checkbox, radios)
  desc: ''        //html element description
};

/**
 * @returns [ {@link formElement} ]
 */
function getElement(fieldName, define, options, values, path) {
  var element = {}, options = options || {}, elLayout = options[fieldName] || {};
  var selOpts = [], elements = [];

  switch (define.type) {
    case 'string':
      //select
      if (define.enum) {
        if (define.const) {
          _.each(define.const, function (v, k) {
            selOpts.push({ tip: v, val: k, selected: 0 });
          });
        } else {
          _.each(define.enum, function (v) {
            selOpts.push({ tip: v, val: v, selected: 0 });
          });
        }

        element = selectGroup(fieldName, define, elLayout, selOpts);
      }
      //input text
      else {
        element = inputGroup(fieldName, define, elLayout);
        if (values) {
          if ('' == path) {
            if (fieldName) {
              element.value = values[fieldName];
            }
          } else {
            element.value = _.get(values, path + '.' + fieldName);
          }
        }
      }

      if ('' != path) {
        element.parent = path;
      }
      elements.push(element);
      break;
    case 'number':
    case 'integer':
      //select
      if (define.enum && define.const) {
        _.each(define.const, function (v, k) {
          selOpts.push({ tip: v, val: k, selected: 0 });
        });

        element = selectGroup(fieldName, define, elLayout, selOpts);
      }
      //input number
      else {
        element = inputGroup(fieldName, define, elLayout, 'number');
        if (values) {
          if ('' == path) {
            if (fieldName) {
              element.value = values[fieldName];
            }
          } else {
            element.value = _.get(values, path + '.' + fieldName);
            element.parent = path;
          }
        }
      }

      if ('' != path) {
        element.parent = path;
      }
      elements.push(element);
      break;
    case 'boolean':
      //input radio
      selOpts.push({ tip: 'True', val: 1, selected: 0 });
      selOpts.push({ tip: 'False', val: 0, selected: 0 });
      element = selectGroup(fieldName, define, elLayout, selOpts, 'radio');
      element.inline = 1;

      if ('' != path) {
        element.parent = path;
      }
      elements.push(element);
      break;
    case 'array':
      var els = [];

      if (define.items) {
        if (fieldName) {
          if ('' == path) {
            path = fieldName;
          } else {
            path = path + '.' + fieldName;
          }
        }

        if ('object' == define.items.type) {
          if (values) {
            _.each(_.get(values, path), function (v, idx) {
              var aPath = path + '[' + idx + ']';
              var arrayEls = getElement(false, define.items, options, values, aPath);
              _.each(arrayEls || [], function (aEl) {
                els.push(aEl);
              });
            });
          } else {
            els = getElement(false, define.items, options, values, path);
          }

          element = fieldsetField(fieldName, define, elLayout);
          element.parent = path;
          _.each(els || [], function (aEl) {
            element.child.items.push(aEl);
          });

          elements.push(element);
        } else {
          if (values) {
            _.each(_.get(values, path), function (v) {
              selOpts.push({ tip: v, val: v, selected: 0 });
            });
          }

          var theEl = selectGroup(fieldName, define.items, elLayout, selOpts);
          if (fieldName) {
            theEl.parent = path.substr(0, path.lastIndexOf('.'));
          }
          elements.push(theEl);
        }
      }

      break;
    case 'object':
      if (fieldName) {
        if ('' == path) {
          path = fieldName;
        } else {
          path = path + '.' + fieldName;
        }
      }

      element = fieldsetField(fieldName, define, elLayout);
      element.parent = path;

      _.each(define.properties || {}, function (v, fieldN) {
        var els = getElement(fieldN, v, options, values, path);
        _.each(els || [], function (aEl) {
          element.child.items.push(aEl);
        });
      });

      elements.push(element);
      break;
  }

  return elements;
}

function selectGroup(fieldName, define, elLayout, selectOptions, groupType) {
  switch (elLayout.el || groupType || 'select') {
    case 'checkbox':
      return checkboxField(fieldName, define, elLayout, selectOptions);
    case 'radio':
      return radioField(fieldName, define, elLayout, selectOptions);
    case 'select':
    default:
      return selectField(fieldName, define, elLayout, selectOptions);
  }
}

function inputGroup(fieldName, define, elLayout, inputType, groupType) {
  switch (elLayout.el || groupType || 'input') {
    case 'textarea':
      return textareaField(fieldName, define, elLayout);
    case 'input':
    default:
      return inputField(fieldName, define, elLayout, inputType);
  }
}

function getEl(fieldName, define, elLayout, formElType) {
  define = define || {};
  var layoutAttrs = elLayout.attrs || {};
  fieldName = fieldName || define.name || layoutAttrs.name;

  var element = {
    el: formElType,
    label: elLayout.label || (fieldName ? _.capitalize(fieldName) : ''),
    desc: elLayout.desc || define.description,
    inline: elLayout.inline || 0,
    value: elLayout.value || ''
  };

  if ('' == elLayout.label) {
    element.label = '';
  }
  if ('' == elLayout.desc) {
    element.desc = '';
  }

  var attrs = {
    id: fieldName,
    name: fieldName
  };

  if (define.required) {
    attrs.required = 'required';
  }

  if (_.has(define, 'allowEmpty')) {
    if (!define.allowEmpty) {
      attrs.minlength = 1;
    }
  }

  if (define.maxLength) {
    attrs.maxlength = define.maxLength;
  }

  if (define.minLength) {
    attrs.minlength = define.minLength;
  }

  if (define.minimum) {
    attrs.min = define.minimum;
  }

  if (define.maximum) {
    attrs.max = define.maximum;
  }

  if (define.title) {
    attrs.title = define.title;
  }

  _.extend(attrs, layoutAttrs);
  element.attrs = attrs;
  return element;
}

function getInputType(define, inputType) {
  var theType = 'text';
  if (define.format) {
    switch (define.format) {
      case 'url': theType = 'url'; break;
      case 'email': theType = 'email'; break;
      case 'date-time': theType = 'datetime'; break;
      case 'date': theType = 'date'; break;
      case 'time': theType = 'time'; break;
      case 'color': theType = 'color'; break;

      case 'ip-address': break;
      case 'ipv6': break;
      case 'host-name': break;
      case 'utc-millisec': break;
      case 'regex': break;
      default: break;

      return theType;
    }
  }

  return inputType || theType;
}

function getMultiOptions(elLayout, selectOptions) {
  var selOpts = [];
  _.each(elLayout.options || [], function (v) {
    selOpts.push(v);
  });
  _.each(selectOptions || [], function (v) {
    selOpts.push(v);
  });

  if (elLayout.selected) {
    var checks = _.isArray(elLayout.selected) ? elLayout.selected : [elLayout.selected];
    var isNumber = _.isNumber(checks[0]);

    _.each(selOpts, function (v) {
      if (checks.indexOf(isNumber ? parseInt(v.val) : v.val) != -1) {
        v.selected = 1;
      }
    });
  }

  return selOpts;
}

function fieldsetField(fieldName, define, elLayout) {
  var element = getEl(fieldName, define, elLayout, 'fieldset');
  element.attrs = _.extend({

  }, element.attrs);

  var child = {
    layout: {
      formEl: 0,
      buttons: [],
      attrs: {}
    },
    items: []
  };

  if (elLayout.child) {
    var cust = elLayout.child, custLayout = cust.layout || {};
    child.layout.formEl = custLayout.formEl || 0;
    _.each(custLayout.buttons || [], function (v) {
      child.layout.buttons.push(v);
    });
    _.extend(child.layout.attrs, custLayout.attrs || {});

    _.each(cust.items || [], function (v) {
      child.items.push(v);
    });
  }

  element.child = child;

  return element;
}

function inputField(fieldName, define, elLayout, inputType) {
  var element = getEl(fieldName, define, elLayout, 'input');
  element.attrs = _.extend({
    type: getInputType(define, inputType)
  }, element.attrs);
  return element;
}

function checkboxField(fieldName, define, elLayout, selectOptions) {
  var element = inputField(fieldName, define, elLayout, 'checkbox');
  element.options = getMultiOptions(elLayout, selectOptions);
  return element;
}

function radioField(fieldName, define, elLayout, selectOptions) {
  var element = inputField(fieldName, define, elLayout, 'radio');
  element.options = getMultiOptions(elLayout, selectOptions);
  return element;
}

function selectField(fieldName, define, elLayout, selectOptions) {
  var element = getEl(fieldName, define, elLayout, 'select');
  element.options = getMultiOptions(elLayout, selectOptions);
  return element;
}

function textareaField(fieldName, define, elLayout) {
  var element = getEl(fieldName, define, elLayout, 'textarea');
  element.attrs = _.extend({
    rows: 3
  }, element.attrs);
  return element;
}

function buttonField(fieldName, define, elLayout) {
  var element = getEl(fieldName, define, elLayout, 'button');
  return element;
}

function filterExclude(els, excludeField, filter) {
  _.each(els, function (el) {
    if ('fieldset' == el.el) {
      if (excludeField.indexOf(el.parent) == -1) {
        var aFilter = [];
        filterExclude(el.child.items, excludeField, aFilter);
        el.child.items = aFilter;
        filter.push(el);
      }
    } else {
      el.parent = el.parent || '';
      el.attrs.shortname = el.attrs.name;
      if ('' != el.parent) {
        el.attrs.name = el.parent + '.' + el.attrs.name;
        el.attrs.id = el.attrs.name.replace(/\./g, '-');
        el.attrs.id = el.attrs.id.replace(/\[/g, '');
        el.attrs.id = el.attrs.id.replace(/\]/g, '');
      }

      if (excludeField.indexOf(el.attrs.name) == -1) {
        filter.push(el);
      }
    }
  });
}

/**
 * Generate form element from schema
 * @param schema      json schema
 * @param options     {@link formElement}
 * @param formOptions  {@link formOptions}
 * @param excludeField  //exclude unnecessary field
 * @param values        //json value
 * @see formElement
 * @returns object {
 *  layout: {formOptions},
 *  items: [ {formElement} ]
 * }
 */
var schemaForm = function(schema, options, formOptions, excludeField, values) {
  var els = getElement(false, schema, options, values, '');
  formOptions = formOptions || {};
  excludeField = excludeField || [];
  if (!formOptions.attrs) {
    formOptions.attrs = {};
  }
  if (!formOptions.buttons) {
    formOptions.buttons = [];
  }
  if (!formOptions.formEl) {
    formOptions.formEl = 1;
  }

  var filter = [];
  excludeField.push('id');
  filterExclude(els, excludeField, filter);

  return {
    layout: formOptions,
    items: filter
  };
};

module.exports = {
  /**
   * Generate html input
   *
   * @param name        element name
   * @param inputType   html input type
   * @param options     {@link formElement}
   * @returns {@link formElement}
   */
  inputEl: function(name, inputType, options) {
    return inputField(name, false, options, inputType);
  },

  /**
   * Generate html select
   *
   * @param name        element name
   * @param options     {@link formElement}
   * @returns {@link formElement}
   */
  selectEl: function(name, options) {
    return selectField(name, false, options);
  },

  /**
   * Generate html radio
   *
   * @param name        element name
   * @param options     {@link formElement}
   * @returns {@link formElement}
   */
  radioEl: function(name, options) {
    return radioField(name, false, options);
  },

  /**
   * Generate html checkbox
   *
   * @param name        element name
   * @param options     {@link formElement}
   * @returns {@link formElement}
   */
  checkboxEl: function(name, options) {
    return checkboxField(name, false, options);
  },

  /**
   * Generate html textarea
   *
   * @param name        element name
   * @param options     {@link formElement}
   * @returns {@link formElement}
   */
  textareaEl: function(name, options) {
    return textareaField(name, false, options);
  },

  /**
   * Generate html button
   *
   * @param name        element name
   * @param options     {@link formElement}
   * @returns {@link formElement}
   */
  buttonEl: function(name, options) {
    return buttonField(name, false, options);
  },

  /**
   * Generate any html element
   *
   * @param name        element name
   * @param options     {@link formElement}
   * @param elementType html element type
   * @returns {@link formElement}
   */
  element: function(elementType, options, name) {
    return getEl(name, false, options, elementType);
  },

  /**
   * Generate form element from json object
   * @param target      json Object
   * @param options     {@link formElement}
   * @param formOptions   form options
   * @param excludeField  exclude unnecessary field
   * @param title       optional, JSON schema title
   * @returns object    see {@link schemaForm}
   */
  fromJSON: function(target, options, formOptions, excludeField, title) {
    var jsonSchema = title ? GenerateSchema.json(title, target) : GenerateSchema.json(target);
    return schemaForm(jsonSchema, options, formOptions, excludeField, target);
  },
  /**
   * @see schemaForm
   */
  fromSchema: schemaForm
};
