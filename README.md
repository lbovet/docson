Docson
======

Documentation for your JSON types.

Give Docson a JSON schema and it will generate a [beautiful documentation](http://lbovet.github.io/docson/index.html#/docson/example.json).

## Features
* [JSON schema](http://json-schema.org/) v4 keywords.
* Runs entirely in the browser.
* Render schema descriptions with markdown

## Installation

* Place the Docson distribution on the web server serving the schemas (to avoid cross-origin issues).

## Usage

* Open [index.html](http://lbovet.github.io/docson/index.html) and enter the schema path in the form field.
* Or give the schema path directly as hash parameter: [index.html#/docson/example.json](http://lbovet.github.io/docson/index.html#/docson/example.json)

Note that you can refer to a sub-schema by adding a json-pointer path as 'dollar-parameter': [index.html#/docson/example.json$items](http://lbovet.github.io/docson/index.html#/docson/example.json$items)

## Widget

To include a Docson schema documentations on any page (wiki, ...) without worrying about messing up with javascript libraries and cross-origin issues:

* Install Docson somewhere as described above.
* Place the following `script` tags in the including page, nothing else is needed:

```
<script src="http://somewhere/path-to-docson/js/docson-widget.js" data-schema="/path-to-schema">
</script>
```

See the [widget example](http://jsfiddle.net/3kXu2/) on jsfiddle.

## Integration

You can also integrate Docson in your application and use its javascript API:

```javascript
docson.doc(element, schema, ref)
```

* `element` is the element which will host the documentation. Either a DOM element or jQuery element.
* `schema` is the URI or path to the schema or a string containing the schema source itself.
* `ref` is an optional json-pointer path to a sub-schema.

Examples:
* [Simple integration example](http://lbovet.github.io/docson/example.html)
* [See it in action](http://lbovet.github.io/typson-demo/) with its buddy [typson](https://github.com/lbovet/typson).

## Limitations

* Mixing unrelated keywords can lead to unexpected results.

Not implemented:
* Non-primitive values in enums and default values
* dependencies, additionalItems, patternProperties

## Development

* [All tests](http://lbovet.github.io/docson/tests/test.html)

Please pull-request your failing schemas in the `tests/` folder and open an issue describing the expected result.

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/lbovet/docson/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

