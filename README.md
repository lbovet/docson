<p align='right'>A <a href="http://www.swisspush.org">swisspush</a> project <a href="http://www.swisspush.org" border=0><img align="top"  src='https://1.gravatar.com/avatar/cf7292487846085732baf808def5685a?s=32'></a></p>
Docson
======

[![NPM version](https://img.shields.io/npm/v/docson.svg)](https://www.npmjs.com/package/docson)

Documentation for your JSON types.

Give Docson a JSON schema and it will generate a [beautiful documentation](http://lbovet.github.io/docson/index.html#/docson/examples/example.json).

## Features
* [JSON schema](http://json-schema.org/) v4 keywords.
* Runs entirely in the browser.
* Render schema descriptions with markdown

## Installation

* Place the Docson distribution on the web server serving the schemas (to avoid cross-origin issues).

## Usage

Example:

```js
var docson=require("docson");

var element=document.body.appendChild(document.createElement("div"));
var schema={
  "title": "Example Schema",
  "type": "object",
  "properties": {
    "firstName": {
      "type": "string"
    },
    "lastName": {
      "type": "string"
    },
    "age": {
      "description": "Age in years",
      "type": "integer",
      "minimum": 0
    }
  },
  "required": ["firstName", "lastName"]
};

docson.doc(element,schema);
```

## API

```javascript
docson.doc(element, schema, ref)
```

* `element` is the element which will host the documentation. Either a DOM element (id or object) or jQuery element.
* `schema` is the URI or path to the schema or a string containing the schema source itself.
* `ref` is an optional json-pointer path to a sub-schema.

[Example](http://lbovet.github.io/docson/example/index.html)

## Limitations

* Mixing unrelated keywords can lead to unexpected results.

Not implemented:
* Non-primitive values in enums and default values
* dependencies, additionalItems, patternProperties

## Development

* [All tests](http://lbovet.github.io/docson/tests/test.html)

Please pull-request your failing schemas in the `tests/` folder and open an issue describing the expected result.

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/lbovet/docson/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

