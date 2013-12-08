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

$(function() {

    var ready = $.Deferred();
    var template;
    var source;
    var stack = [];

    Handlebars.registerHelper('scope', function(schema, options) {
        if(schema && (schema.id || schema.root)) {
            stack.push( schema );
            var result = options.fn(this);
            stack.pop();
            return result;
        } else {
            return options.fn(this);
        }
    });

    Handlebars.registerHelper('source', function(schema) {
        delete schema.root;
        return JSON.stringify(schema, null, 2);
    });

    Handlebars.registerHelper('desc', function(id, title, description) {
        if(!id) {
            title = undefined;
        }
        if( !title && !description ) return "";
        var text = title ? title : "";
        text = text + (title ? "\n"+description: description);
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
            return options.fn(this);
        }
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
        console.log(name);
        return name;
    }

    Handlebars.registerHelper('name', function(schema) {
        return getName(schema);
    });

    Handlebars.registerHelper('refName', function(ref) {
        if(ref.indexOf("#") != -1) {
            var name = getName(resolvePointerRef(ref));
            if(!name) {
                if(ref == "#") {
                    name = "<root>";
                } else {
                    var segments = ref.replace("#", "/").split("/");
                    name = name || segments[segments.length-1];
                }
            }
            return name;
        } else {
            return ref;
        }
    });

    function renderSchema(schema, id) {
        if(stack.indexOf(schema) == -1) { // avoid recursion
            var message = id ? "Could not resolve schema "+id : "Null schema";
            if(schema) {
                return new Handlebars.SafeString(template(schema));
            } else {
                return new Handlebars.SafeString("<span class='error'>"+message+"</span>");
            }
        }
    }

    Handlebars.registerHelper('ref', function(ref) {
        return renderSchema(resolveRef(ref), ref);
    });

    Handlebars.registerHelper('schema', function(schema) {
        return renderSchema(schema);
    });

    $.get("template.html").done(function(content) {
        source = content
        template = Handlebars.compile(source);
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
            element.addClass("docson").html(template(schema));

            if(highlight) {
                element.find(".json-schema").each(function(k, schemaElement) {
                    highlight.highlightSchema(schemaElement);
                });
            }

            element.find(".property-type-expandable").click(function() {
                $(this).toggleClass("property-type-expanded");
                $(this).parent().parent().parent().children(".property-type-container").toggle(300);
            });
            element.find(".expand").click(function() {
                if(this.expanded) {
                    $(this).html(" + ").attr("title", "Expand all");                
                    $(this).parent().parent().find(".property-type-expandable").removeClass("property-type-expanded");
                    $(this).parent().parent().find(".property-type-container").hide(300);
                    this.expanded=false;
                } else {
                    $(this).html(" - ").attr("title", "Collapse all");
                    $(this).parent().parent().find(".property-type-expandable").addClass("property-type-expanded");
                    $(this).parent().parent().find(".property-type-container").show(300);
                    this.expanded=true;
                }
            });
            element.find(".source-button").click(function() {
                $(this).parent().parent().children(".type-body").toggle();
                $(this).parent().parent().children(".source").toggle();
            });
        })
    }
});
