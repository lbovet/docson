var docson=require("docson");
var $=require("jquery");

var tests = [ "invoice$Invoice", "enum", "schema","additionalProperties", "address", "fstab", "basic", "not", "oneOf", "anyOf", "allOf", "example2", "properties", "ref"]


tests.forEach(function(test) {

  var block=document.body.appendChild(document.createElement("div"));
  var segments = test.split("$");
  var title=document.createElement("h2");
  title.textContent=segments[0];
  document.body.appendChild(title);
  document.body.appendChild(block);
  $.get(segments[0]+".json").done(function(items) {
    items.forEach(function(item) {
      var element = document.createElement("div");
      block.appendChild(element);
      if(!item.schema.description) {
        item.schema.description = item.description;
      }
      docson.doc(element, item.schema, segments[1]);
    });
  });
});