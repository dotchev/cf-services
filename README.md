[![npm](https://img.shields.io/npm/v/cf-services.svg)](https://www.npmjs.com/package/cf-services)
[![Build Status](https://travis-ci.org/dotchev/cf-services.svg?branch=master)](https://travis-ci.org/dotchev/cf-services)

# cf-services
Simple node package to lookup bound services in [Cloud Foundry]

## Background
Cloud Foundry provides an application with the credentials of bound [service instances][2] via environment variable [VCAP_SERVICES].

![VCAP_SERVICES](VCAP_SERVICES.png)

Notice that *VCAP_SERVICES* object uses service names as keys.
Since multiple instances of the same service can be bound to one application,
the property values are arrays of service bindings.
This makes it inconvenient for applications to lookup required
service bindings in a reliable way.

See [this presentation][3] for more details.

## Install

```sh
npm install --save cf-services
```

## Usage
If you bind a service to your app like this:
```sh
cf create-service redis small my-redis
cf bind-service my-app my-redis
```
You can get this binding in your app like this:
```js
var cfServices = require('cf-services');

var redis = cfServices('my-redis');
// redis = { label: '...', name: 'my-redis', credentials: {...}, ... }
```
Unfortunately the instance name is rarely known in advance, so you may pass it as a separate environment variable:
```sh
cf set-env my-app REDIS_SERVICE_NAME my-redis
```
Then grab it in your app like this:
```js
var redis = cfServices(process.env.REDIS_SERVICE_NAME);
```
You can also look up service bindings with matching properties:
```js
var matches = cfServices({ label: 'redis', plan: 'large' });
var redis = matches[i];
```
or get bindings with a certain tag:
```js
var matches = cfServices({ tags: ['store'] }); 
```
or use a custom function to filter the bindings:
```js
var matches = cfServices(binding => 
  binding.label === 'redis' || binding.tags.includes('redis')); 
```

## Local execution

The ability to test your application locally outside Cloud Foundry is important as it improves turnaround time and hence developer productivity.

One option is to use a tool like [dotenv] that mocks the process environment. The problem with solutions like this is that they pollute your productive code with code that is used only during testing.

A better approach is to setup the process environment (VCAP_SERVICES) in a similar way to Cloud Foundry. Then it is completely transparent to your app if it is running locally or in Cloud Foundry. You can do this in a shell script or using some tool like [fireup] which supports multiline environment variables.

## API

### `cfServices([query])`
Parses *VCAP_SERVICES* environment variable and returns matching service bindings.
* if `query` argument is not provided, returns a flat object of service bindings using instance names as keys
* if `query` is a string, returns the binding with the same instance name or `undefined` if there is no match
* if `query` is an object or function, returns an array of service bindings matching the given query as implemented in [_.filter](5).
* throws an error if *VCAP_SERVICES* is not defined or its value is not a valid JSON string

## Alternatives

Instead of this package, you can use *lodash* (which you probably already require in your code):
```js
const _ = require('lodash');

var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
var svc = _.keyBy(_.flatMap(vcapServices), 'name');
var redis = svc.redis1;
var postgres = _.filter(svc, {tags: ['sql']})[0];
```
Actually this is what this package is [using internally](index.js).
So why remember those APIs, when you can just use this simple package.

This package is similar to [cfenv] but is simpler as it is focused only on service bindings.

## License
[MIT](LICENSE)

## See Also
[Proposal for named service bindings][4]

[Cloud Foundry]:https://www.cloudfoundry.org/
[VCAP_SERVICES]:https://docs.cloudfoundry.org/devguide/deploy-apps/environment-variable.html#VCAP-SERVICES
[dotenv]:https://www.npmjs.com/package/dotenv
[fireup]:https://github.com/dotchev/fireup
[cfenv]:https://github.com/cloudfoundry-community/node-cfenv
[2]:https://docs.cloudfoundry.org/devguide/services/
[3]:https://docs.google.com/presentation/d/1yCcZLyXGMAEGa3q-qZ6XIDR2zUD8jsYfjDNwjjY5yIs/edit?usp=sharing
[4]:https://github.com/dotchev/cf-named-binding
[5]:https://lodash.com/docs/4.17.4#filter
