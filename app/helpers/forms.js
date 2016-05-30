'use strict';

var log = log_from('forms'),
  GenerateSchema = require('generate-schema');

var formElement = {
  el: 'input',      //html element type, input|fieldset|button|select|textarea|radio|checkbox
  attrs: {          //html element attributes or any custom attributes
    id: '',
    name: '',
    type: '',       //eg: input type, hidden|text
    placeholder: '',
    required: 'required',
    readonly: 'readonly',
    checked: 'checked',
    disabled: 'disabled'
  },

  child: [ '{element}' ],   //form fieldset if el is fieldset, {element} array

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

  parent: '',    //parent field name if defind type is 'object' or 'array'
  label: '',      //html element label
  value: '',      //html element value if element is not (select, checkbox, radios)
  desc: ''        //html element description
};

/**
 * @returns [ {@link formElement} ]
 */
function getElement(fieldName, define, options, index) {
  var element = {}, options = options || {}, elLayout = options[fieldName] || {};
  var selOpts = [], elements = [];
  if (fieldName && index) {
    fieldName = fieldName + '-' + index;
  }

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
      }

      elements.push(element);
      break;
    case 'boolean':
      //input radio
      selOpts.push({ tip: 'True', val: 1, selected: 0 });
      selOpts.push({ tip: 'False', val: 0, selected: 0 });
      element = selectGroup(fieldName, define, elLayout, selOpts, 'radio');
      element.inline = 1;

      elements.push(element);
      break;
    case 'array':
      _.each(define.items || [], function (v, idx) {
        var els = getElement(false, v, options, idx);
        _.each(els || [], function (aEl) {
          if (fieldName) {
            aEl.parent = fieldName;
          }
          elements.push(aEl);
        });
      });
      break;
    case 'object':
      _.each(define.properties || {}, function (v, fieldN) {
        var els = getElement(fieldN, v, options);
        _.each(els || [], function (aEl) {
          if (fieldName) {
            aEl.parent = fieldName;
          }
          elements.push(aEl);
        });
      });
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

/**
 * Generate form element from schema
 * @param schema      json schema
 * @param options     {@link formElement}
 * @param formOptions   form options
 * {
 *  formEl: 1,  //form tag, 0 none form element tag, 1 output form tag, default is 1
 *  buttons: [ {formElement} ],
 *  attrs: {}   //html form element attributes or any custom attributes
 * }
 * @param excludeField  exclude unnecessary field
 * @see formElement
 * @returns object {
 *  layout: {formOptions},
 *  items: [ {formElement} ]
 * }
 */
var schemaForm = function(schema, options, formOptions, excludeField) {
  var els = getElement(false, schema, options);
  formOptions = formOptions || {};
  if (!formOptions.attrs) {
    formOptions.attrs = {};
  }
  if (!formOptions.buttons) {
    formOptions.buttons = [];
  }
  if (!formOptions.formEl) {
    formOptions.formEl = 1;
  }

  if ((excludeField || []).length < 1) {
    return {
      layout: formOptions,
      items: els
    };
  }

  var filter = [];
  excludeField.push('id');
  _.each(els, function (el) {
    if (excludeField.indexOf(el.attrs.name) == -1) {
      filter.push(el);
    }
  });

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
    return schemaForm(jsonSchema, options, formOptions, excludeField);
  },
  /**
   * @see schemaForm
   */
  fromSchema: schemaForm
};
