/*! n 2013-11-21 */
!function(a,b){"use strict";function c(a,b){var d,e=C.call(arguments),f="boolean"===l(e[e.length-1])?e.pop():!0;b=e[e.length-1],1==e.length&&(a=this);for(d in b)if(B.call(b,d)){if(B.call(a,d))throw new Error("sorry "+d+" is already in the receiver object");!f||"object"!==l(b[d])&&"array"!==l(b[d])?a[d]=b[d]:(a[d]={},c(a[d],b[d]))}return a}function d(a,b){for(var c,d=C.call(arguments),e=1,f=d.length;f>e;e++){b=d[e];for(c in b)if(B.call(b,c)){if(B.call(a,c))throw new Error("sorry "+c+" is already in the receiver object");a[c]=b[c]}}}function e(a,b,c){var d=h(a),a=d.modelName,e=L[a];return e?e:(c||(c=b,b=[]),e={name:a,deps:b,wrap:c},L[a]=e,e)}function f(a){var c=[],d=h(a),a=d.modelName,e=d.modelUrl,g=L[a],i=M[a];if(g===b)console.log(a+" 文件构建有误，重新加载文件！"),q(e,function(){f(a),console.log(a+" 文件加载运行完成！")});else{if(i)return i;m(g.deps,function(a){c.push(f(a))}),i=g.wrap.apply(this,c)}return M[a]=i,i}function g(a){return f(a)}function h(a){var c=I.exec(a);return{modelName:c[2],modelUrl:w+(c[1]===b?"/":"/"+c[1])+c[2]+".js"}}function i(a){w=/http|ftp|file/.test(a)?a:v+"//"+a}function j(a){return A.call(a)===F}function k(a){return A.call(a)===G}function l(a){return"object"==typeof a?null===a?"null":E.exec(A.call(a))[1].toLowerCase():typeof a}function m(a,b,c){var d,e,f=x.forEach;if(c=c||this,null!=a)if(f&&a.forEach===f)a.forEach(b,c);else if(j(a))for(d=0,e=a.length;e>d;d++)b.call(c,a[d],d,a);else for(var g in a)B.call(a,g)&&b.call(c,a[g],g,a)}function n(a,b,c){var d,e,f,g=x.map;if(c=c||this,null!=a){if(g&&a.map===g)return a.map(b,c);if(j(a))for(f=[],d=0,e=a.length;e>d;d++)f.push(b.call(c,a[d],d,a));else{f={};for(var h in a)B.call(a,h)&&(f[h]=b.call(c,a[h],h,a))}return f}}function o(a,b,c){var d,e,f,g=x.filter;if(c=c||this,null!=a){if(g&&a.filter===g)return a.filter(b,c);if(j(a))for(f=[],d=0,e=a.length;e>d;d++)b.call(c,a[d],d,a)&&f.push(a[d]);else{f={};for(var h in a)B.call(a,h)&&b.call(c,a[h],h,a)&&(f[h]=a[h])}return f}}function p(a,b){var c=t.createElement(a);return b=b||{},m(b,function(a,b){c.setAttribute(b,a)}),c}function q(a,b){var c=p("script",{async:!0,type:"text/javascript"}),d=q.head=q.head||t.getElementsByTagName("head")[0];H.test(u)?c.onreadystatechange=function(){/complete|loaded/.test(c.readyState)&&(c.onreadystatechange=null,b())}:c.onload=function(){b()},c.src=a,d.appendChild(c)}function r(a){var b=p("link",{rel:"stylesheet",type:"text/css"}),c=r.head=r.head||t.getElementsByTagName("head")[0];b.href=a,c.appendChild(b)}var s=(a.N,a.N={}),t=(s.NID="N"+ +new Date,a.document),u=navigator.userAgent,v=location.protocol,w=location.origin,x=Array.prototype,y=Object.prototype,z=String.prototype,A=y.toString,B=y.hasOwnProperty,C=x.slice,D=z.trim,E=(z.trimLeft,z.trimRight,/\[object (\w+)\]/),F="[object Array]",G="[object Function]",H=/(MSIE) ([\w.]+)/,H=/(Opera)([\w.]+)/,H=/(Gecko\/)([\w.]+)/,I=/(?:\.?\/)?([\w\W]*\/)?([\w\W]*)/,J=function(){function a(){}return function(b){return a.prototype=b,a.prototype.constructor=b,new a}}();d(s,{extend:c,mix:d,createObject:J});var K,L={},M={};K={define:e,require:g,execute:f},d(s,{define:e,require:g,execute:f,dealname:h,setAbsUrl:i}),d(s,{isArray:j,isFunction:k,type:l}),d(s,{each:m,map:n,filter:o}),d(s,{createNode:p,loadScript:q,loadCss:r});var N,O,P;D?(N=function(a){return a.trim()},O=function(a){return a.trimLeft()},P=function(a){return a.trimRight()}):(N=function(a){return a.rplace(/^\s+|\s+$/g,"")},O=function(a){return a.rplace(/^\s+/g,"")},P=function(a){return a.rplace(/\s+$/g,"")}),d(s,{trim:N,ltrim:O,rtrim:P})}(window),N.define("$",function(){"use strict";function a(a,c){var d,e=[],f=0,g=/\s*,\s*/,i={},j=[],c=c||h;if(a.nodeType)return[a];if("string"!=typeof a)return[];if(-1===a.indexOf(","))return b(a,c);for(e=a.split(g),f=e.length,d=0;f>d;d++)i=b(e[d],c),j=j.concat(i);return j}function b(a,b){return b.querySelectorAll?f.call(b.querySelectorAll(a)):a.indexOf("#")?(a=a.slice(1),[h.getElementById(a)]):a.indexOf(".")?(a=a.slice(1),c(a,b)):f.call(b.getElementsByTagName(a))}function c(a,b){var c,d,e=[];return b.getElementsByClassName?f.call(b.getElementsByClassName(a)):(c=b.getElementsByTagName("*"),d=c.length,i(c,function(a){-1!==(" "+a.classname+" ").indexof(" "+str+" ")&&e.push(a)}),e)}var d=Object.prototype,e=Array.prototype,f=(d.toString,d.hasOwnProperty,e.slice),g=window,h=g.document,i=N.each;return function(b,c){return a(b,c)}}),N.define("cookie",function(){function a(a,b,d){d="object"==typeof d?d:{expires:d};var e=void 0!==d.expires?d.expires*dayMS:defExpired;e=";expires="+new Date(+new Date+e).toGMTString();var f=d.path;f=f?";path="+f:"";var g=d.domain;g=g?";domain="+g:"";var h=d.secure?";secure":"";return document.cookie=c(a)+"="+c(b)+e+f+g+h,c(a)+"="+c(b)}function b(a){var b,e,f,g=d.cookie,h=g.split(/;\s?/i);for(b=0,e=h.length;e>b;b++)if(f=h[b].split("="),2===f.length)return f[0]===c(a)?decodeURIComponent(f[1]):""}function c(a){return(a+"").replace(/[,;"'\\=\s%]/g,function(a){return encodeURIComponent(a)})}var d=document;return dayMS=86400,defExpired=7*dayMS,function(c,d,e){return c?void 0===d?b(c):a(c,d,e):void 0}}),N.define("css",function(){N.trim}),N.define("data",function(){function a(a,b,h){var i,j;return a.nodeType?(i=void 0!==a[e]?a[e]:a[e]=++d,j=c[i]||(c[i]={})):j=a,"undefined"===f(h)?j[b]:("object"===f(h)||"array"===f(h)?(j[b]={},g(j[b],h)):j[b]=h,void 0)}function b(a,b){var d=a[e];if(a.nodeType){if(void 0===d)return;b?delete c[d][b]:c[d]=void 0}else delete a[b]}var c=[],d=-1,e=N.NID,f=N.type,g=N.extend;return{data:a,removeData:b}}),N.define("event",["data"],function(a){"use strict";function b(a,b){function c(){return!0}var d,e,g=b||{};for(d in a)g[d]=a[d];if(g.target||(g.target=g.srcElement||i),originalEvent&&f.test(a.type)&&a.pageX===e&&a.clientX!==e){var h=g.target.ownerDocument||document,i=h.documentElement,j=h.body;g.pageX=a.clientX+(i&&i.scrollLeft||j&&j.scrollLeft||0)-(i&&i.clientLeft||j&&j.clientLeft||0),g.pageY=a.clientY+(i&&i.scrollTop||j&&j.scrollTop||0)-(i&&i.clientTop||j&&j.clientTop||0)}return g.preventDefault=function(){g.isPreventedDefault=c,a&&(a.preventDefault?a.preventDefault():a.returnValue=!1)},g.stopPropagation=function(){g.isStopedPropagation=c,a&&(a.stopPropagation?a.stopPropagation():a.cancelBubble=!0)},g.stop=function(){g.preventDefault(),g.stopPropagation()},g}function c(){function c(a,b){var c,d,e,f;if(c=b[a.type])for(d=0,e=c.length;e>d;d++)f=c[d],f&&f.func.call(f.scope,a)===!1&&a.preventDefault()}var d=this;d.domLoaded=!1,d.bind=function(d,f,h,i){function j(a){a=b(a||window.event),a.type="focus"===a.type?"focusin":"focusout",c(a,l)}var k,l,m,h={func:h,scope:i||d};return d[e]?k=d[e]:a(d,"event",{}),l=a.data(k).event,m=l[f]||[],m?m.push(h):g(d,f,j,!1),d=m=null,h},d.unbind=function(b,c,d){var f,g,h,i,j;if(f=b[e],(f=b[e])&&(g=a.data(f).event)&&(h=g[c]))for(i=0,j=h.length;j>i;i++)if(h[i].func===d)return h.splice(i,1),void 0},d.fire=function(b,d){var f,g,h,i;f=b[e],(f=b[e])&&(g=a.data(f).event)&&(h=g[d])&&(i={type:d},c(i,g))},d.clean=function(b,c){var d,f;d=b[e],(d=b[e])&&(f=a.data(d).event)&&(c?f[c]=c:a.removeData(b,"event"))},d.stop=function(a){a=b(a||window.event),a.stop()}}var d=document,e=N.NID,f=/^(?:mouse)|click/,g=function(){return d.addEventListener?function(a,b,c,d){a.addEventListener(b,c,d||!1)}:d.attachEvent?function(a,b,c){a.attachEvent("on"+b,c)}:function(a,b,c){a["on"+b]=c}}(),h=(function(){return d.removeEventListener?function(a,b,c,d){a.removeEventListener(b,c,d||!1)}:d.detachEvent?function(a,b,c){a.detachEvent("on"+b,c)}:function(a,b){a["on"+b]=null}}(),new c);return h});