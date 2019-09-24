# Revision history for docson 

## $NEXT

* Fix build not to require pnpx [GH#76, cwalther]

## v2.1.0 - 2018-08-08

* Display examples as part of the description, if present. [GH#60, jvican]
* Add support for consts. [jvican]

## v2.0.1 - 2018-07-23

* Release to npm.

## v2.0.0 - 2018-07-18

* NPMize the project. [GH#38]
* Add 'docson' cli program. [GH#62]

## v1.1.0

### Enhancements

* Make the UI adapt to the container it sits in. [GH#44, valentinvieriu]

### Bugs

* Resolve #definitions of non-root schemas. [GH#49, Frassle, yanick] 
* Avoid requesting the same URL multiple times. [GH#46, jpmckinney]
* Relative local paths are based on the referring schema, not the original one. [GH#53,  Krokop]
* README markdown fixes. [GH#57, olleolleolle]

### Misc

* Add Nightwatch.js-based tests.

