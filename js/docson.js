/*
 * Copyright 2013 Laurent Bovet <laurent.bovet@windmaster.ch>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Docson 0.1

var docson = docson || {};
var exports = exports || {};

docson.templateBaseUrl="templates";

$(function() {

    var ready = $.Deferred();
    var boxTemplate;
    var signatureTemplate;
    var source;
    var stack = [];
    var boxes=[];

    Handlebars.registerHelper('scope', function(schema, options) {
        var result;
        boxes.push([]);
        if(schema && (schema.id || schema.root)) {
            stack.push( schema );
            result = options.fn(this);
            stack.pop();
        } else {
            result = options.fn(this);
        }
        boxes.pop();
        return result;
    });

    Handlebars.registerHelper('source', function(schema) {
        delete schema.root;
        delete schema.__boxId;
        return JSON.stringify(schema, null, 2);
    });

    Handlebars.registerHelper('desc', function(schema) {
        var title = schema.title;
        var description = schema.description;

        if( !title && !description ) return "";
        var text = title ? title : "";
        text = text + (description ? (title ? "\n"+description: description) : "");
        text = text.replace("\n", "\n\n").trim();
        var markdown = exports.Markdown;
        if(markdown) {
            return new Handlebars.SafeString(markdown.toHTML(text));
        } else {
            return text;
        }
    });

    Handlebars.registerHelper('equals', function(lvalue, rvalue, options) {
        if (arguments.length < 3)
            throw new Error("Handlebars Helper equals needs 2 parameters");
        if( lvalue!=rvalue ) {
            return options.inverse(this);
        } else {
            return options.fn(this);
        }
    });

    Handlebars.registerHelper('contains', function(arr, item, options) {;
        if(arr && arr.indexOf(item) != -1) {
            return options.fn(this);
        }
    });

    Handlebars.registerHelper('primitive', function(type, options) {
        if(type && type != "object" && type != "array") {
            return withType(this, options)
        }
    });

    Handlebars.registerHelper('exists', function(value, options) {
        if(value !== undefined) {
            return options.fn(this);
        }
    });

    Handlebars.registerHelper('range', function(from, to, replFrom, replTo, exclFrom, exclTo, sep) {
        var result = "";
        if(from !== undefined || to !== undefined) {
            result += exclFrom ? "]" : "[";
            result += from !== undefined ? from : replFrom;
            if( (from || replFrom) !== (to || replTo)) {
                result += (from !== undefined || replFrom !== null) && (to !== undefined || replTo !== null) ? sep : "";
                result += to !== undefined ? to : replTo;
            }
            result += exclTo ? "[" : "]";
            return result;
        }
    });

    var sub = function(schema) {
        return schema.type == "array" || schema.allOf || schema.anyOf || schema.oneOf || schema.not || schema.enum || schema.additionalProperties;
    }

    Handlebars.registerHelper('sub', function(schema, options) {
        if(sub(schema)) {
            return options.fn(this);
        }
    });

    Handlebars.registerHelper('main', function(schema, options) {
        if(!sub(schema)) {
            return options.fn(this);
        }
    });

    var simpleSchema = function(schema) {
        var result = schema.description===undefined && schema.title===undefined && schema.id===undefined;
        result &= schema.properties===undefined;
        return result;
    };

    Handlebars.registerHelper('simple', function(schema, options) {
        if(simpleSchema(schema) && !schema.$ref) {
            return withType(schema, options);
        }
    });

    var withType = function(schema, options) {
        schema.__type = schema.type;
        if(!schema.type) {
            schema.__type="any";
        }
        if(schema.format) {
            schema.__type=schema.format;
        }
        if( (schema.__type == "any" || schema.__type == "object") && schema.title) {
            schema.__type = schema.title;
        }
        var result = options.fn(schema);
        delete schema.__type;
        return result;
    }

    Handlebars.registerHelper('complex', function(schema, options) {
        if(!simpleSchema(schema) && !schema.$ref || schema.properties) {
            return withType(schema, options);
        }
    });

    Handlebars.registerHelper('obj', function(schema, options) {
        if(schema.properties || schema.type == "object") {
            return withType(schema, options);
        }
    });

    var pushBox = function(schema) {
        boxes[boxes.length-1].push(schema);
    }

    Handlebars.registerHelper('box', function(schema, options) {
        if(schema) {
            pushBox(schema);
            return options.fn(schema);
        }
    });

    Handlebars.registerHelper('boxId', function() {
        return boxes[boxes.length-1].length
    });

    Handlebars.registerHelper('boxes', function(options) {
        var result="";
        $.each(boxes[boxes.length-1], function(k, box) {
            box.__boxId = k+1;
            result=result+options.fn(box);
        });
        boxes[boxes.length-1] = []
        return result;
    });

    var resolveIdRef = function(ref) {
        if(stack) {
            var i;
            for(i=stack.length-1; i>=0; i--) {
                if(stack[i][ref]) {
                    return stack[i][ref];
                }
            }
        }
        return null;
    }

    var resolvePointerRef = function(ref) {
        var root = stack[0];
        if(ref=="#") {
            return root;
        }
        try {
            return jsonpointer.get(stack[0], ref);
        } catch(e) {
            console.log(e);
            return null;
        }
    }

    var resolveRef = function(ref) {
        if(ref.indexOf("#") != -1) {
            return resolvePointerRef(ref);
        } else {
            return resolveIdRef(ref);
        }
    }

    var getName = function(schema) {
        if(!schema) {
            return "<error>";
        }
        var name = schema.title;
        name = !name && schema.id ? schema.id: name;
        return name;
    }

    Handlebars.registerHelper('name', function(schema) {
        return getName(schema);
    });

    var refName = function(ref) {
        var name = ref;
        if(ref.indexOf("#") != -1) {
            name = getName(resolvePointerRef(ref));
            if(!name) {
                if(ref == "#") {
                    name = "<root>";
                } else {
                    name = ref.replace("#", "/")
                }
            }
        }
        var segments = name.split("/");
        name = segments[segments.length-1];
        return name;
    }

    function renderSchema(schema) {
        if(stack.indexOf(schema) == -1) { // avoid recursion
            return new Handlebars.SafeString(boxTemplate(schema));
        }
    }

    Handlebars.registerHelper('ref', function(schema, options) {
        if(schema.$ref) {
            var target = resolveRef(schema.$ref);
            if(target) {
                target.__name = refName(schema.$ref);
            }
            var result = options.fn(target);
            if(target) {
                delete target.__name;
            }
            return result;
        }
    });

    Handlebars.registerHelper('schema', function(schema) {
        return renderSchema(schema);
    });

    Handlebars.registerHelper('signature', function(schema, keyword, schemas) {
        if(!schemas) {
            schemas = []
        }
        schemas = schemas instanceof Array ? schemas : [schemas];
        return new Handlebars.SafeString(signatureTemplate({ schema: schema, keyword: keyword, schemas: schemas}));
    });

    Handlebars.registerHelper('l', function(context) {
        console.log(context);
    });

    $.when( $.get(docson.templateBaseUrl+"/box.html").done(function(content) {
        source = content
        boxTemplate = Handlebars.compile(source);
    }), $.get(docson.templateBaseUrl+"/signature.html").done(function(content) {
        source = content
        signatureTemplate = Handlebars.compile(source);
    })).always(function() {
        ready.resolve();
    });

    docson.doc = function(element, schema) {
        ready.done(function() {
            if(typeof element == "string") {
                element = $("#"+element);
            }
            if(typeof schema == "string") {
                schema = JSON.parse(schema);
            }
            schema.root = true;

            element.addClass("docson").html(boxTemplate(schema));

            if(highlight) {
                element.find(".json-schema").each(function(k, schemaElement) {
                    highlight.highlightSchema(schemaElement);
                });
            }

            element.find(".signature-type-expandable").click(function() {
                var boxId = $(this).attr("boxid");
                console.log(boxId);
                $(this).toggleClass("signature-type-expanded");
                $(this).parent().parent().parent().children(".signature-box-container").children("[boxid='"+boxId+"']").toggle(300);
            });
            element.find(".expand").click(function() {
                if(this.expanded) {
                    $(this).html(" + ").attr("title", "Expand all");                
                    $(this).parent().parent().find(".signature-type-expandable").removeClass("signature-type-expanded");
                    $(this).parent().parent().find(".box-container").hide(300);
                    this.expanded=false;
                } else {
                    $(this).html(" - ").attr("title", "Collapse all");
                    $(this).parent().parent().find(".signature-type-expandable").addClass("signature-type-expanded");
                    $(this).parent().parent().find(".box-container").show(300);
                    this.expanded=true;
                }
            });
            element.find(".source-button").click(function() {
                $(this).parent().parent().children(".box-body").toggle();
                $(this).parent().parent().children(".source").toggle();
            });
        })
    }
});
