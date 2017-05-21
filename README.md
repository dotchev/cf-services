[![npm](https://img.shields.io/npm/v/cf-services.svg)](https://www.npmjs.com/package/cf-services)
[![Build Status](https://travis-ci.org/dotchev/cf-services.svg?branch=master)](https://travis-ci.org/dotchev/cf-services)

# cf-services
Simple and reliable lookup of bound services for Node.js apps in [Cloud Foundry]

The [change log](CHANGELOG.md) describes the changes between versions.

## Background
Cloud Foundry provides an application with the credentials of bound [service instances][2] via environment variable [VCAP_SERVICES].

![VCAP_SERVICES](VCAP_SERVICES.png)

Notice that *VCAP_SERVICES* object uses service names as keys.
Since multiple instances of the same service can be bound to one application,
the property values are arrays of service bindings.
This makes it inconvenient for applications to look up required
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
You can also look up a service binding with matching properties:
```js
var redis = cfServices({ label: 'redis', plan: 'large' });
```
or get the binding with a certain tag:
```js
var store = cfServices({ tags: ['store'] }); 
```
or use a custom function to filter the bindings:
```js
var redis = cfServices(binding => 
  binding.label === 'redis' || binding.tags.includes('redis')); 
```
Finally, if called without arguments, it will return a flat object of all service bindings keyed by their names:
```js
var bindings = cfServices();
// bindings = { 'my-redis1': {...}, 'my-redis2': {...}, ... }
```
Notice that this is different from `VCAP_SERVICES` which uses service names (`label` property) as keys.

**Note** that `cfServices` will throw an exception if no service binding matches the given criteria or multiple service bindings match the criteria. This way you don't need to perform additional checks in your code. You know that if the call succeeds, there is exactly one match.

In case of inconsistent configuration, an application should abort during startup with a clear error message instead of keep running and fail later during productive use. Even worse, the application might seem to work without errors but produce wrong results which are hard to revert. For example an application writing to a wrong database.

In some cases you don't want to deal with exceptions. Then you can filter service bindings and deal with varying number of matches:
```js
var matches = cfServices.filter({ tags: ['redis'] }); 
if (matches === 1) {
  let redis = matches[0];
} else {
  // handle misconfiguration
}
```

## Local execution

The ability to test your application locally outside Cloud Foundry is important as it improves turnaround time and hence developer productivity.

One option is to use a tool like [dotenv] that mocks the process environment. The problem with solutions like this is that they pollute your productive code with code that is used only during testing.

A better approach is to setup the process environment (VCAP_SERVICES) in a similar way to Cloud Foundry. Then it is completely transparent to your app if it is running locally or in Cloud Foundry. You can do this in a shell script or using some tool like [fireup] which supports multiline environment variables.

## API

### `cfServices([query, [description]])`
* `query`
  * if `query` argument is not provided, returns a flat object of service bindings using instance names as keys
  * if `query` is a string, returns the binding with the same instance name
  * if `query` is an object, returns the service binding with matching properties, see [_.filter][5].
  * if `query` is a function, it should take a service binding as argument and return a boolean. `cfServices` then returns the service binding for which the `query` function returns `true`.
* `description` - optional query description used in error messages
* _returns_ the service binding matching the `query` or an object with all service bindings if `query` is not provided
* _throws_ an error if:
  * *VCAP_SERVICES* is not defined
  * *VCAP_SERVICES* value is not a valid JSON string
  * No service binding matches the `query`
  * Multiple service bindings match the `query`

Parses *VCAP_SERVICES* environment variable and returns the matching service binding.

For example these two are equivalent except that (1) will throw if there is no service instance with name `some-instance` while (2) will return `undefined`.
```js
cfServices('some-name')   // (1)
cfServices()['some-name'] // (2)
```

### `cfServices.filter(query)`
* `query` - object or filter function
* _returns_ an array of matching service bindings, empty if there are no matches
* _throws_ an error if:
  * *VCAP_SERVICES* is not defined
  * *VCAP_SERVICES* value is not a valid JSON string

Unlike `cfServices`, this function will not throw an error if there are no matches or multiple matches are found.

```js
cfServices.filter(query)
// is equivalent to
_.filter(cfServices(), query)
```

## Alternatives

Instead of this package, you can use *lodash* (which you probably already require in your code):
```js
const _ = require('lodash');

var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
var svc = _.keyBy(_.flatMap(vcapServices), 'name');
var redis = svc.redis1;
var postgres = _.filter(svc, {tags: ['sql']})[i];
```
Actually this is what this package is [using internally](index.js).
So why remember those APIs, when you can just use one simple function.

This package is similar to [cfenv] but is simpler as it is focused only on service bindings.
Also this package provides easy filtering of service bindings powered by *lodash* [filter][5].

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
[5]:https://lodash.com/docs#filter
