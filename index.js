'use strict';

const _ = require('lodash');

module.exports = services;

function services(query) {
  if (!process.env.VCAP_SERVICES) {
    throw new Error('Environment variable VCAP_SERVICES is not defined');
  }
  try {
    var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
  } catch (err) {
    throw new Error('Could not parse environment variable VCAP_SERVICES: ' +
      err.message);
  }
  let svc = _(vcapServices).flatMap().filter(x => x.name).keyBy('name').value();
  if (!query) {
    return svc;
  }
  if (typeof query === 'string') {
    return svc[query];
  }
  return _.filter(svc, query);
}
