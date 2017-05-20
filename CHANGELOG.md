# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## 2.0.0 - 2017-05-20

### Changed
- `cfServices` does not return an array but a service binding, if a single match is found. Otherwise it throws an error.

### Added
- `cfServices` takes an additional argument `description`
- `cfServices.filter` function to get all matching service bindings
