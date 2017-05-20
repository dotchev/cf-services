'use strict';

const tap = require('tap');
const cfServices = require('./');

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

const VCAP_SERVICES = JSON.stringify({
  postgres: [
    postgres1,
    postgres2
  ],
  redis: [
    redis1,
    redis2
  ]
});

tap.test('cfServices', t => {
  delete process.env.VCAP_SERVICES;
  t.throws(() => cfServices(), /VCAP_SERVICES/,
    'Throws if VCAP_SERVICES is not defined');

  process.env.VCAP_SERVICES = 'ala-bala';
  t.throws(() => cfServices(), /VCAP_SERVICES/,
    'Throws if VCAP_SERVICES is not a valid JSON string');

  process.env.VCAP_SERVICES = '5';
  t.strictSame(cfServices(), {},
    'Returns an empty object if VCAP_SERVICES is not an object');

  process.env.VCAP_SERVICES = '{ "a":"x", "b":"y" }';
  t.strictSame(cfServices(), {},
    'Returns an empty object if VCAP_SERVICES does not contain the right structure');

  process.env.VCAP_SERVICES = VCAP_SERVICES;

  t.strictSame(cfServices(), {
    postgres1,
    postgres2,
    redis1,
    redis2
  }, 'Returns an object with all service bindings using instance names as keys');

  t.strictSame(cfServices('redis1'), redis1,
    'Returns the binding for the service instance with given name');
  
  t.throws(() => cfServices('nosuch'),
    /No service instance with name nosuch/,
    'Throws, if there is no service instance with given name');

  t.throws(() => cfServices({ tags: ['sql'] }),
    /Multiple.*sql.*postgres1.*postgres2/,
    'Throws, if multiple service bindings match the given query');
  
  t.throws(() => cfServices({ tags: ['sql'] }, 'SQL db'),
    /Multiple.*SQL db.*postgres1.*postgres2/,
    'Includes the query description the error message');
  
  t.strictSame(cfServices({ tags: ['db', 'sql'] }), postgres2,
    'Returns the single service binding matching the query');

  t.strictSame(cfServices({ label: 'redis', plan: 'large' }), redis2,
    'Returns the service binding with matching label and plan');

  t.strictSame(cfServices(binding => /res2/.test(binding.name)), postgres2,
    'Returns the single service binding matching the filter function');

  t.throws(() => cfServices(binding => /s3/.test(binding.label), 'S3'),
    /No.*S3/,
    'Throws, if no service binding matches the given filter function');

  t.throws(() => cfServices(binding => /res/.test(binding.label)),
    /Multiple.*filter.*postgres1.*postgres2/,
    'Throws, if multiple service bindings match the given filter function');

  t.end();
});

tap.test('cfServices.filter', t => {
  delete process.env.VCAP_SERVICES;
  t.throws(() => cfServices.filter(), /VCAP_SERVICES/,
    'Throws if VCAP_SERVICES is not defined');

  process.env.VCAP_SERVICES = 'ala-bala';
  t.throws(() => cfServices.filter(), /VCAP_SERVICES/,
    'Throws if VCAP_SERVICES is not a valid JSON string');

  process.env.VCAP_SERVICES = '5';
  t.strictSame(cfServices.filter(), [],
    'Returns an empty array if VCAP_SERVICES is not an object');

  process.env.VCAP_SERVICES = '{ "a":"x", "b":"y" }';
  t.strictSame(cfServices.filter(), [],
    'Returns an empty array if VCAP_SERVICES does not contain the right structure');

  process.env.VCAP_SERVICES = VCAP_SERVICES;
  t.strictSame(cfServices.filter(), [postgres1, postgres2, redis1, redis2],
    'Returns all service bindings when called without arguments');
  t.strictSame(cfServices.filter('redis1'), [],
    'Returns an empty array when called with a string');
  t.strictSame(cfServices.filter({ name: 'redis1' }), [redis1],
    'Returns all servce bindings with matching instance name');
  t.strictSame(cfServices.filter({ name: 'nosuch' }), [],
    'Returns an empty array, if there are no matching servce bindings');

  t.strictSame(cfServices.filter({ tags: ['sql'] }), [postgres1, postgres2],
    'Returns all servce bindings with matching tag');
  t.strictSame(cfServices.filter({ tags: ['db', 'sql'] }), [postgres2],
    'Returns all servce bindings with matching tags');

  t.strictSame(cfServices.filter({ label: 'redis', plan: 'large' }), [redis2],
    'Returns all servce bindings with matching label and plan');

  t.strictSame(cfServices.filter(binding => /postgre/.test(binding.label)), [postgres1, postgres2],
    'Returns all servce bindings matching a custom filter function');
  
  t.end();
});
