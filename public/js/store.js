(function(root, core, component){

  var proto = {};

  proto = function(key, value, options) {
    if (core.isUndefined(value)) { return proto.get(key); }
    if (core.isNull(value)) { var v = proto.get(key); proto.remove(key); return v; }
    proto.set(key, value);
    return value;
  };

  core.extend(proto, require('store-js'));
  core.register(component, proto);

})(this, lemon, 'store');
