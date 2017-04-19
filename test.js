'use strict';

const tap = require('tap');
const cfServices = require('./');

delete process.env.VCAP_SERVICES;
tap.throws(() => cfServices(), /VCAP_SERVICES/,
  'Throws if VCAP_SERVICES is not defined');

process.env.VCAP_SERVICES = 'ala-bala';
tap.throws(() => cfServices(), /VCAP_SERVICES.*JSON/,
  'Throws if VCAP_SERVICES is not a valid JSON string');

process.env.VCAP_SERVICES = '5';
tap.same(cfServices(), {}, 
  'Returns an empty object if VCAP_SERVICES is not an object');

process.env.VCAP_SERVICES = '{ "a":"x", "b":"y" }';
tap.same(cfServices(), {}, 
  'Returns an empty object if VCAP_SERVICES does not contain the right structure');

const postgres1 = {
  label: 'postgres',
  plan: 'small',
  name: 'postgres1',
  tags: ['postgresql', 'sql'],
  credentials: {
    user: 'postgres1-user',
    password: 'postgres1-pass'
  }
};
const postgres2 = {
  label: 'postgres',
  plan: 'large',
  name: 'postgres2',
  tags: ['postgresql', 'sql', 'db'],
  credentials: {
    user: 'postgres2-user',
    password: 'postgres2-pass'
  }
};
const redis1 = {
  label: 'redis',
  plan: 'small',
  name: 'redis1',
  credentials: {
    user: 'redis1-user',
    password: 'redis1-pass'
  }
};
const redis2 = {
  label: 'redis',
  plan: 'large',
  name: 'redis2',
  credentials: {
    user: 'redis2-user',
    password: 'redis2-pass'
  }
};

process.env.VCAP_SERVICES = JSON.stringify({
  postgres: [
    postgres1,
    postgres2
  ],
  redis: [
    redis1,
    redis2
  ]
});

tap.same(cfServices(), {
  postgres1,
  postgres2,
  redis1,
  redis2
}, 'Returns an object with all service bindings using instance names as keys');

tap.same(cfServices('redis1'), redis1,
  'Returns the binding for the service instance with given name');
tap.equal(cfServices('nosuch'), undefined,
  'Returns undefined, if there is no service instance with given name');

tap.same(cfServices({ name: 'redis1' }), [redis1],
  'Returns all servce bindings with matching instance name');
tap.same(cfServices({ name: 'nosuch' }), [],
  'Returns an empty array, if there are no matching servce bindings');

tap.same(cfServices({ tags: ['sql'] }), [postgres1, postgres2],
  'Returns all servce bindings with matching tag');
tap.same(cfServices({ tags: ['db', 'sql'] }), [postgres2],
  'Returns all servce bindings with matching tags');

tap.same(cfServices({ label: 'redis', plan: 'large' }), [redis2],
  'Returns all servce bindings with matching label and plan');

