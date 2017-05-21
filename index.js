'use strict';

const _ = require('lodash');

module.exports = cfServices;
cfServices.filter = filter;

function cfServices(query, queryDescription) {
  let services = parseServices();
  if (!query) {
    return services;
  }
  if (typeof query === 'string') {
    if (!services[query]) {
      throw new Error(`No service instance with name ${query}`);
    }
    return services[query];
  }
  let matches = _.filter(services, query);
  if (matches.length === 1) {
    return matches[0];
  }
  if (!queryDescription) {
    queryDescription = typeof query === 'function' ? 'the filter' : JSON.stringify(query);
  }
  if (matches.length === 0) {
    throw new Error(`No service instance matches ${queryDescription}`);
  }
  throw new Error(`Multiple service instances match ${queryDescription}: ` +
    matches.map(m => m.name).join(', '));
}

function filter(query) {
  let services = parseServices();
  return _.filter(services, query);
}

function parseServices() {
  if (!process.env.VCAP_SERVICES) {
    throw new Error('Environment variable VCAP_SERVICES is not defined');
  }
  try {
    var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
  } catch (err) {
    throw new Error('Could not parse environment variable VCAP_SERVICES: ' +
      err.message);
  }
  return _(vcapServices).flatMap().filter('name').keyBy('name').value();
}