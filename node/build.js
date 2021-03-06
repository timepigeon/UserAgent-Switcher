'use strict';

var fs = require('fs');
var path = require('path');
var UAParser = require('./ua-parser.min.js');

var cache = {};
var map = {
  browser: {},
  os: {},
  matching: {}
};

var parser = new UAParser();

var write = ({name, content}, callback) => fs.writeFile('./browsers/' + name, content, 'utf8', e => {
  if (e) {
    console.log(e);
  }
  setTimeout(callback, 0);
  console.log(name);
});

fs.readdir('./browsers/', async (err, files) => {
  if (err) throw err;
  for (const file of files) {
    fs.unlinkSync(path.join('./browsers/', file), err => {
      if (err) throw err;
    });
  }
  //
  const list = [
    ...require('./list-1.json'),
    ...require('./list-2.json'),
    ...require('./list-3.json'),
    ...require('./list-4.json'),
    ...require('./list-5.json')
  ].filter((s, i, l) => l.indexOf(s) === i && ['bot', 'fb_iab', 'fbsv', 'w3m', 'elinks'].some(k => s.toLowerCase().indexOf(k) !== -1) === false);
  for (const ua of list) {
    parser.setUA(ua);
    const o = parser.getResult();
    if (o.browser.name && o.os.name) {
      const bb = o.browser.name.toLowerCase();
      const ss = o.os.name.toLowerCase();

      cache[bb] = cache[bb] || {};
      cache[bb][ss] = cache[bb][ss] || [];
      cache[bb][ss].push(o);

      map.browser[bb] = map.browser[bb] || [];
      map.browser[bb].push(o.browser.name);

      map.os[ss] = map.os[ss] || [];
      map.os[ss].push(o.os.name);
    }
    else {
      // console.log(ua);
    }
  }
  const contents = [];
  for (const browser of Object.keys(cache)) {
    for (const os of Object.keys(cache[browser])) {
      const name = browser + '-' + os.replace(/\//g, '-') + '.json';
      const content = JSON.stringify(cache[browser][os]);
      contents.push({
        name,
        content
      });
      map.matching[browser] = map.matching[browser] || [];
      if (map.matching[browser].indexOf(os) === -1) {
        map.matching[browser].push(os);
      }
    }
  }
  const once = () => {
    const obj = contents.shift();
    if (obj) {
      write(obj, once);
    }
    else {
      for (const os of Object.keys(map.os)) {
        map.os[os] = map.os[os].filter((s, i, l) => l.indexOf(s) === i && [
          'UNIX',
          'debian',
          'gentoo',
          'ubuntu',
          'WIndows',
          'kubuntu'
        ].some(k => k === s) === false);
        if (map.os[os].length > 1) {
          throw Error('Duplicated OS; add the ones that need to be removed to the list: ', map.os[os].join(', '));
        }
      }
      for (const browser of Object.keys(map.browser)) {
        map.browser[browser] = map.browser[browser].filter((s, i, l) => l.indexOf(s) === i && [
          'Webkit',
          'MAXTHON',
          'conkeror',
          'icecat',
          'Iceweasel',
          'iceweasel',
          'midori',
          'Palemoon',
          'Seamonkey'
        ].some(k => k === s) === false);
        if (map.browser[browser].length > 1) {
          console.log(map.browser[browser]);
          throw Error('Duplicated browser; add the ones that need to be removed to the list');
        }
      }

      fs.writeFile('./map.json', JSON.stringify({
        browser: Object.values(map.browser).map(k => k[0]),
        os: Object.values(map.os).map(k => k[0]),
        matching: map.matching
      }), () => {});
    }
  };
  once();
});

