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

var docson = docson || {};

docson.templateBaseUrl="templates";

import $ from 'jquery';
import _ from 'lodash';

const Handlebars  = require('handlebars/dist/handlebars');
import jsonpointer from 'jsonpointer.js';
import marked from 'marked';
import URI from 'urijs';
import traverse from 'traverse';

const debug = require('debug')('docson');

const highlight = false;

    var resolve_ready;
    var ready = new Promise( (resolve,reject) => {
        resolve_ready = resolve;
    });

    var boxTemplate;
    var signatureTemplate;
    var source;
    var stack = [];
    var boxes=[];

    var schemaDocuments = {};

    var resolveRefsReentrant;

    function get_document(url) {
        if( !schemaDocuments[url] ) {
            schemaDocuments[url] = $.get(url).then(function(content){
                if(typeof content != "object") {
                    try {
                        content = JSON.parse(content);
                    } catch(e) {
                        console.error("Unable to parse "+segments[0], e);
                        content = {};
                    }
                }
                return content;
            });

            schemaDocuments[url].then(function(schema){
                resolveRefsReentrant(schema, url );
            })
        }
        return schemaDocuments[url];
    }



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
        delete schema.__name;
        delete schema.__ref;
        return JSON.stringify(schema, null, 2);
    });

    Handlebars.registerHelper('desc', function(schema) {
        var description = schema.description;
        var examples = schema.examples;

        var text = "";

        if( !description && !examples ) {
            return "";
        }

        if ( description ) {
            text = description
        }

        if ( examples && examples.length > 0 ) {
            text += "\n\n*Examples* \n";
            examples.forEach( e => {
                text += "\n\n```\n" + e + "\n```\n\n";
            });
        }

        if(marked) {
            marked.setOptions({gfm: true, breaks: true})
            return new Handlebars.SafeString(marked(text));
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
        if(arr && arr instanceof Array && arr.indexOf(item) != -1) {
            return options.fn(this);
        }
    });

    Handlebars.registerHelper('primitive', function(schema, options) {
        if(schema.type && schema.type != "object" && schema.type != "array" || schema.enum || schema.const) {
            return withType(this, options, true)
        }
    });

    Handlebars.registerHelper('exists', function(value, options) {
        if(value !== undefined) {
            value = value === null ? "null": value;
            value = value === true ? "true": value;
            value = value === false ? "false": value;
            value = typeof value === "object" ? JSON.stringify(value): value;
            this.__default = value;
            var result = options.fn(this);
            delete this.__default;
            return result;
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
        return schema.type == "array" || schema.allOf || schema.anyOf || schema.oneOf || schema.not;
    }

    Handlebars.registerHelper('sub', function(schema, options) {
        if(sub(schema) || (schema.type && schema.type != "object" && schema.type != "array") || schema.enum) {
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
            return withType(schema, options, true);
        }
    });

    var withType = function(schema, options, hideAny) {
        schema.__type = schema.type;
        if(!schema.type && !hideAny) {
            schema.__type="any";
        }
        if (schema.const) {
            schema.__type=schema.const;
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

    Handlebars.registerHelper('enum', function(schema) {
        if(schema.enum) {
            return (schema.enum.length > 1) ? "enum": "constant";
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
        var root = stack[1];
        if(ref=="#") {
            return root;
        }
        try {
            return jsonpointer.get(stack[1], ref);
        } catch(e) {
            console.log(e);
            return null;
        }
    }

    var resolveRef = function(ref) {
        if(ref.indexOf("#") == 0) {
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
        name = !name ? schema.__name: name;
        return name;
    }

    Handlebars.registerHelper('name', function(schema, options) {
        schema.__name = getName(schema);
        if(schema.__name) {
            return options.fn(schema);
        }
    });

    var refName = function(ref) {
        var name = getName(resolveRef(ref));
        if(!name) {
            if(ref == "#") {
                name = "<root>";
            } else {
                name = ref.replace("#", "/")
            }
        }
        var segments = name.split("/");
        name = segments[segments.length-1];
        return name;
    }

    function renderSchema(schema) {
        if(stack.indexOf(schema) == -1) { // avoid recursion
            stack.push(schema);
            var ret = new Handlebars.SafeString(boxTemplate(schema));
            stack.pop();
            return ret;
        } else {
            return new Handlebars.SafeString(boxTemplate({"description": "_circular reference_"}));
        }
    }

    Handlebars.registerHelper('ref', function(schema, options) {
        if(schema.$ref) {
            var target = resolveRef(schema.$ref);
            if(target) {
                target.__name = refName(schema.$ref);
                target.__ref = schema.$ref.replace("#", "");
            }
            var result;
            if(target) {
                result = options.fn(target);
            } else {
                result = new Handlebars.SafeString("<span class='signature-type-ref'>"+schema.$ref+"</span>");
            }
            if(target) {
                delete target.__ref;
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

    function init() {
        $.get(docson.templateBaseUrl+"/box.html").done(function(content) {
            source = content
            boxTemplate = Handlebars.compile(source);

            $.get(docson.templateBaseUrl+"/signature.html").done(function(content) {
                source = content
                signatureTemplate = Handlebars.compile(source);

                resolve_ready();
            });
        });
    };

    docson.doc = function(element, schema, ref, baseUrl) {
        var resolve_d;
        var d = new Promise( resolve => {
            debug( 'Promise B' );
            resolve_d = resolve ;
        });
        if(baseUrl === undefined) baseUrl='';
        init();
        var renderBox;
        var throttled_render = _.throttle( () => renderBox(), 1000 );
        ready.then(function() {
            if(typeof element == "string") {
                element = $("#"+element);
            }
            if(typeof schema == "string") {
                schema = JSON.parse(schema);
            }

            var refs = {};
            var get_ref = function(uri) {
                return new Promise( (resolve, reject) => {
                    get_document( uri.clone().hash('').toString() ).then(function(schema){
                    refs[uri.toString()] = uri.hash() ? jsonpointer.get( schema, uri.hash() ) : schema;
                }).then(function(){ 
                    debug('get_ref');
                    resolve();
                }, reject);
                });
            };

            renderBox = function() {
                debug('render');
                stack.push(refs);
                var target = schema;
                if(ref) {
                    ref = ref[0] !== '/' ? '/'+ref : ref;
                    target = jsonpointer.get(schema, ref);
                    stack.push( schema );
                }
                target.root = true;
                target.__ref = "<root>";
                var html = boxTemplate(target);

                if(ref) {
                    stack.pop();
                }
                stack.pop();

                element.addClass("docson").html(html);

                var resizeHandler = element.get(0).onresize;
                function resized() {
                    if(resizeHandler) {
                        var box = element.find(".box").first();
                        element.get(0).onresize(box.outerWidth(), box.outerHeight());
                    }
                }
                element.get(0).resized = resized;
                resized();

                if(highlight) {
                    element.find(".json-schema").each(function(k, schemaElement) {
                        highlight.highlightSchema(schemaElement);
                    });
                }
                element.find(".box-title").each(function() {
                   var ref = $(this).attr("ref");
                   if(ref) {
                       if(window.location.href.indexOf("docson/index.html") > -1) {
                           $(this).find(".box-name").css("cursor", "pointer").attr("title", "Open in new window")
                           .hover(
                               function(){ $(this).addClass('link') },
                               function(){ $(this).removeClass('link') })
                           .click(function() {
                                var url = window.location.href+"$$expand";
                                if(ref !=="<root>") {
                                   url = url.replace(/(docson\/index.html#[^\$]*).*/, "$1$"+ref+"$$expand");
                                }
                                var w;
                                function receiveMessage(event) {
                                   if (event.data.id && event.data.id == "docson" && event.data.action == "ready") {
                                       w.postMessage({ id: "docson", action: "load", definitions: schema, type: event.data.url.split("$")[1], expand: true}, "*");
                                   }
                                }
                                window.addEventListener("message", receiveMessage, false);
                                w = window.open(url, "_blank");
                           });
                       }
                   }
                });
                element.find(".box").mouseenter(function() {
                    $(this).children(".source-button").fadeIn(300);
                    $(this).children(".box-body").children(".expand-button").fadeIn(300);
                });
                element.find(".box").mouseleave(function() {
                    $(this).children(".source-button").fadeOut(300);
                    $(this).children(".box-body").children(".expand-button").fadeOut(300);
                });
                element.find(".signature-type-expandable").click(function() {
                    var boxId = $(this).attr("boxid");
                    $(this).toggleClass("signature-type-expanded");
                    $(this).parent().parent().parent().children(".signature-box-container").
                        children("[boxid='"+boxId+"']").toggle(resizeHandler ? 0 : 300);
                    resized();
                });
                element.find(".expand-button").click(function() {
                    if($(this).attr("expanded")) {
                        $(this).parent().parent().find(".expand-button").html(" + ").attr("title", "Expand all");
                        $(this).parent().parent().find(".signature-type-expandable").removeClass("signature-type-expanded");
                        $(this).parent().parent().find(".box-container").hide( resizeHandler ? 0 : 300);
                        $(this).parent().parent().find(".expand-button").removeAttr("expanded");
                        resized();
                    } else {
                        $(this).parent().parent().find(".expand-button").html(" - ").attr("title", "Collapse all");
                        $(this).parent().parent().find(".signature-type-expandable").addClass("signature-type-expanded");
                        $(this).parent().parent().find(".box-container").show(resizeHandler ? 0 : 300);
                        $(this).parent().parent().find(".expand-button").attr("expanded", true);
                        resized();
                    }
                });
                element.find(".source-button").click(function() {
                    $(this).parent().children(".box-body").toggle();
                    $(this).parent().children(".source").toggle();
                    resized();
                });
            };

            var resolveSchemaRef = function( parentObject, item, baseUrl ) {
                debug('resolveSchemaRef', parentObject, item, baseUrl);

                return new Promise( ( resolve, reject ) => {
                    // not a $ref? we're done
                    if( parentObject.key !== "$ref") return resolve();

                    if ( typeof baseUrl === 'string' ) {
                        baseUrl = new URI( baseUrl );
                    }


                    var uri = new URI( item );

                    // ah, it's a relative url
                    if( ! uri.host() ) {
                        if ( uri.path() ) {
                            if( uri.path()[0] !== '/' ) { // relative path
                                var dir = [ baseUrl.directory(), uri.path() ].join('/');
                                uri.path(dir);
                            }
                        }
                        else {
                            uri = baseUrl.clone().hash( uri.hash() );
                        }
                    }

                    uri.normalize();

                    // use the normalized uri
                    parentObject.update( uri.toString() );

                    var refp = get_ref(uri);
                    debug(refp);
                    refp.finally( () => {
                        throttled_render();
                        resolve();
                    })
                    // avoid "unhandled rejection" error - the output may be redundant as the
                    // browser probably already logged the failure, but better be explicit
                    .catch(e => { console.warn("Unable to resolve $ref " + uri.toString() + ":", e); });
                });
            }

            resolveRefsReentrant = function(schema, relPath){
                debug( 'resolveRefsReentrant' );
                if (relPath === undefined) {
                   relPath = new URI(baseUrl);
                }

                let p = [];

                traverse(schema).forEach(function(item) {
                    // Fix Swagger weird generation for array.
                    if(item && item.$ref == "array") {
                        delete item.$ref;
                        item.type ="array";
                    }

                    p.push( resolveSchemaRef( this, item, relPath ) );
                });

                return Promise.all(p).finally();
            };
            
            resolveRefsReentrant(schema).finally( throttled_render ).then( resolve_d ).catch( e => console.log('oops', e )  );
        })
        return d.finally( throttled_render );
    }

export default docson;
