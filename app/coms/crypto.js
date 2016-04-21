'use strict';

var crypto = require('crypto'),
  lzs = require('lz-string'),
  algorithm = 'aes-256-ctr',
  passwd = '6b8a3a41af62181c3c1370f67d96ccfd';

var compress = function(target) {

  return lzs.compressToEncodedURIComponent(_.isString(target) ? target : JSON.stringify(target));
};

var decompress = function(target) {
  return lzs.decompressFromEncodedURIComponent(target);
};

module.exports = {
  encrypt: function (target) {
    var cipher = crypto.createCipher(algorithm, passwd);
    var crypted = cipher.update(target, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return compress(crypted);
  },

  decrypt: function (target) {
    var decipher = crypto.createDecipher(algorithm, passwd);
    var dec = decipher.update(decompress(target), 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
  },

  compress: compress,
  decompress: decompress
};

