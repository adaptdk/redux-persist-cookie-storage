var Cookies = require('cookies-js');
var FakeCookieJar = require('./fake-cookie-jar');

function CookieStorage(options) {
  options = options || {};

  this.keyPrefix = options.keyPrefix || '';
  this.indexKey = options.indexKey || 'reduxPersistIndex';
  this.expiration = options.expiration || null;

  if (options.windowRef) {
    this.cookies = Cookies(options.windowRef);
  } else if (typeof window !== 'undefined') {
    this.cookies = Cookies;
  } else {
    this.cookies = new FakeCookieJar(options.cookies);
  }
}

CookieStorage.prototype.getItem = function (key, callback) {
  callback(null, this.cookies.get(this.keyPrefix + key) || 'null');
}

CookieStorage.prototype.setItem = function (key, value, callback) {
  var options, defaultOptions;

  if (this.expiration !== null) {
    defaultOptions = this.expiration.default;
    options = {
      expires: this.expiration[key] || defaultOptions
    }
  }

  this.cookies.set(this.keyPrefix + key, value, options);

  this.getAllKeys(function (error, allKeys) {
    if (allKeys.indexOf(key) === -1) {
      allKeys.push(key);
      this.cookies.set(this.indexKey, JSON.stringify(allKeys), defaultOptions);
    }
    callback(null);
  }.bind(this));
}

CookieStorage.prototype.removeItem = function (key, callback) {
  this.cookies.expire(this.keyPrefix + key);

  this.getAllKeys(function (error, allKeys) {
    allKeys = allKeys.filter(function (k) {
      return k !== key;
    });

    this.cookies.set(this.indexKey, JSON.stringify(allKeys));
    callback(null);
  }.bind(this));
}

CookieStorage.prototype.getAllKeys = function (callback) {
  var cookie = this.cookies.get(this.indexKey);

  var result = [];
  if (cookie) {
    result = JSON.parse(cookie);
  }

  callback(null, result);
}

module.exports = CookieStorage
