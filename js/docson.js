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

$(function() {

    var ready = $.Deferred();
    var template;
    var source;

    var stack = [];
    
    Handlebars.registerHelper('scope', function(schema, options) {
        if(schema && (schema.id || schema.root)) {
            stack.push( schema );
            return options.fn(this);
            stack.pop();
        } else {
            return options.fn(this);
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

    Handlebars.registerHelper('primitive', function(type, options) {
        if(typeof type != "object" && type != "array") {
            return options.fn(this);
        }
    });

    var resolveIdRef = function(ref) {
        if(stack) {
            for(i=stack.length-1; i>=0; i--) {
                if(stack[i][ref]) {
                    return stack[i][ref];
                }
            }
        }
        return null;
    }

    Handlebars.registerHelper('refName', function(ref) {
        return ref;
    });

    Handlebars.registerHelper('ref', function(ref) {
        var template = Handlebars.compile(source);
        return new Handlebars.SafeString(template(resolveIdRef(ref)));
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
            schema.root = true;
            element.addClass("docson").html(template(schema));

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
            })
        })
    }
});
