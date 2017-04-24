[![npm](https://img.shields.io/npm/v/cf-services.svg)](https://www.npmjs.com/package/cf-services)
[![Build Status](https://travis-ci.org/dotchev/cf-services.svg?branch=master)](https://travis-ci.org/dotchev/cf-services)

# cf-services
Simple node package to lookup bound services in [Cloud Foundry]

## Background
Cloud Foundry provides the credentials of bound [service instances][2] via
[VCAP_SERVICES] environment variable.

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
```js
const cfServices = require('cf-services');
```
For the following examples let's assume that environment variable VCAP_SERVICES has this value:
```json
{
  "postgres": [
    {
      "label": "postgres",
      "name": "postgres1",
      "plan": "small",
      "tags": ["postgresql", "sql", "db"],
      "credentials": { ... }
    },
    {
      "label": "postgres",
      "name": "postgres2",
      "plan": "large",
      "tags": ["postgresql", "sql", "store"],
      "credentials": { ... }
    }
  ],
  "redis": [
    {
      "label": "redis",
      "name": "redis1",
      "plan": "small",
      "tags": ["redis", "key-valye", "in-memory"],
      "credentials": { ... }
    },
    {
      "label": "redis",
      "name": "redis2",
      "plan": "large",
      "tags": ["redis", "store"],
      "credentials": { ... }
    }
  ]
}
```
Parse *VCAP_SERVICES* and convert it to a flat object of service bindings using instance names as keys.
```js
let services = cfServices();
```
this will return:
```json
{
  "postgres1": {
    "label": "postgres",
    "name": "postgres1",
    "plan": "small",
    "tags": ["postgresql", "sql", "db"],
    "credentials": { ... }
  },
  "postgres2": {
    "label": "postgres",
    "name": "postgres2",
    "plan": "large",
    "tags": ["postgresql", "sql", "store"],
    "credentials": { ... }
  },
  "redis1": {
    "label": "redis",
    "name": "redis1",
    "plan": "small",
    "tags": ["redis", "key-valye", "in-memory"],
    "credentials": { ... }
  },
  "redis2": {
    "label": "redis",
    "name": "redis2",
    "plan": "large",
    "tags": ["redis", "store"],
    "credentials": { ... }
  }
}
```
Now you can pick a binding directly like this
```js
let redis = services.redis1
```
Unfortunately the instance name is rarely known in advance, so you may pass it as a separate environment variable:
```js
let redis = services[process.env.REDIS_SERVICE_NAME];
```
To achieve this you can use a *manifest.yml* like this:
```yml
---
  ...
  env:
    REDIS_SERVICE_NAME: redis1
  services:
    - redis1
```
You can also look up service bindings with matching properties.
For example this
```js
cfServices({ label: 'redis', plan: 'large' }) 
```
will return
```js
[{
  "label": "redis",
  "name": "redis2",
  "plan": "large",
  "tags": ["redis", "store"],
  "credentials": { ... }
}]
```
or this
```js
cfServices({ tags: ['store'] }) 
```
will return
```js
[
  {
    "label": "postgres",
    "name": "postgres2",
    "plan": "large",
    "tags": ["postgresql", "sql", "store"],
    "credentials": { ... }
  },
  {
    "label": "redis",
    "name": "redis2",
    "plan": "large",
    "tags": ["redis", "store"],
    "credentials": { ... }
  }
]
```

### Local execution

The ability to test your application locally outside Cloud Foundry is important as it improves turnaround time and hence developer productivity.

One option is to use a tool like [dotenv] that mocks the process environment. The problem with solutions like this is that they polute your productive code with code that is used only during testing.

A better approach is to setup the process environment (VCAP_SERVICES) in a similar way to Cloud Foundry. Then it is completely transparent to your app if it is running locally or in Cloud Foundry. You can do this in a shell script or using some tool like [fireup] which supports multiline environment variables.

## API

### `cfServices([query])`
Parses *VCAP_SERVICES* environment variable and returns matching service bindings.
* if `query` argument is not provided, returns a flat object of service bindings using instance names as keys
* if `query` is a string, returns the binding with the same instance name or `undefined` if there is no match
* if `query` is an object, returns an array of service bindings matching the given object
* throws an error if *VCAP_SERVICES* is not defined or its value is not a valid JSON string

## Alternative 

Instead of this package, you can use *lodash* (which you probably already require in your code):
```js
const _ = require('lodash');

let vcapServices = JSON.parse(process.env.VCAP_SERVICES);
let svc = _.keyBy(_.flatMap(vcapServices), 'name');
let redis = svc.redis1;
let postgres = _.filter(svc, {tags: ['sql']})[0];
```
Actually this is what this package is [using internally](index.js).
So why remember those APIs, when you can just use this simple package.

## License
[MIT](LICENSE)

## See Also
[Proposal for named service bindings][4]

[Cloud Foundry]:https://www.cloudfoundry.org/
[VCAP_SERVICES]:https://docs.cloudfoundry.org/devguide/deploy-apps/environment-variable.html#VCAP-SERVICES
[dotenv]:https://www.npmjs.com/package/dotenv
[fireup]:https://github.com/dotchev/fireup
[2]:https://docs.cloudfoundry.org/devguide/services/
[3]:https://docs.google.com/presentation/d/1yCcZLyXGMAEGa3q-qZ6XIDR2zUD8jsYfjDNwjjY5yIs/edit?usp=sharing
[4]:https://github.com/dotchev/cf-named-binding
