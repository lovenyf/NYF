// 简单的 N 框架

// 实现模块加载化

(function(global, undefined){
    'use strict';

    // 大对象
    var _N = global.N,
         N = global.N = {},

        doc = global.document,
        head = doc.header || doc.getElementsByTagName("head")[0],
        userAgent = navigator.userAgent,

        isW3C = ( doc.dispatchEvent !== false);

    // 原型方法引用
    var ArrayProto = Array.prototype,
        ObjectProto = Object.prototype,
        StringProto = String.prototype,

        toString = ObjectProto.toString,
        hasOwn = ObjectProto.hasOwnProperty,
        slice = ArrayProto.slice;

    // 类型判定对象
    var class2type = {
            "[object HTMLDocument]" : "document",
            "[object global]" : "window",
            "[object HTMLCollection]" : "nodeList",
            "[object StaticNodeList]" : "nodeList",
            "[object IXMLDOMNodeList]" : "nodeList",
            "null" : "null",
            "NaN" : "NaN",
            "undefined" : "undefined"
        };

    "Boolean, Number, String, Function, Array, Date, RegExp, Document, Element, Arguments, NodeList"
        .replace( /[^, ]+/g , function( type ){
            class2type["[object " + type + "]"] = type.toLowerCase();
        } );


/********************************* 扩展继承 *************************************/
    /** 对象扩展 mix
    *  
    *   @method mix  不扩展原型属性
    *   @param {obj} receiver 可选 扩展的目标对象 如果无 则扩展到外围为对象（一般为 N）
    *   @param {obj} obj 必选 要扩展到目标对象的对象数据
    *   @param {boolean} ride 可选 主要是标识是否覆盖原有对象属性 默认为true
    *   @param {boolean} deep 可选 主要是标识是否需要简单的深度拷贝 默认为false
    *
    *   @return {Object} 返回目标对象
    *   
    */
    function mix(receiver, obj){
        var args = slice.call(arguments), key, i = 1,
            deep, ride, value, valueType;

        if( typeof args[args.length-2] === "boolean" ){
            deep = args.pop();
            ride = args.pop();
        }else{
            ride = (typeof args[args.length-1] === "boolean")?args.pop():true;
            deep = false;
        }

        if(args.length < 2){
            receiver = ( this !== global ) ? this : {};
            i = 0;
            if( args.length === 0 ){
                return receiver;
            }
        }

        while( obj = args[ i++ ] ){
            for( key in obj ){
                if( hasOwn.call(obj, key) ){
                    if( ride || !(key in  receiver) ){
                        value = obj[key];
                        valueType = type(value);
                        if( deep && ( valueType==="object")){
                            receiver[key]={};
                            mix(receiver[key], value, ride, deep);
                        }else if( deep && ( valueType==="array" )){
                            receiver[key]=[];
                            mix(receiver[key], value, ride, deep);
                        }else{
                            receiver[key] = obj[key];
                        }
                    }
                }
            }
        }
            
        return receiver;
    }

    mix(N, {
        version : "1.0.0",
        NID : "N"+ (+new Date()),

        sStringReg : /[^, ]+/g,
        // 处理模块id 进行规范化处理正则
        regRName : /(\.?\/)?([\w\W]*\/)?([\w\W]*)/,

        mix : mix,
        createObject : function(){
            // 用于使用来继承扩展对象
            return function(obj){
                function F(){};
                F.prototype = obj;
                F.prototype.constructor = obj;
                return new F();     
            }
        },

        trim : function( str ){
            return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
        },
        ltrim : function( str ){
            return str.trimLeft ? str.trimLeft() : str.replace(/^\s+/g, '');
        },
        rtrim : function( str ){
            return str.trimRight ? str.trimRight() : str.replace(/\s+$/g, '');
        }
    });


/************************** 底层基础工具函数 **************************************/
    /*   isArray  isFunction type  检测目标类型
    *   each map  filter some every迭代循环
    *   createNode 创建node对象
    *   loadScript 加载脚本文件
    *
    *
    */


/************************** 类型判定 **************************************/

    // 类型判定
    function type( obj, isType ){
        var key = ((obj == null || obj !== obj ) ? obj + "" : toString.call( obj )),
            result;
        
        if( typeof(result = class2type[ key ]) !== "string" ){
            if( obj.nodeType === 9 ){
                result = class2type["object HTMLDocument"];
            }else if(obj.nodeType === 1){
                result = class2type["object Element"];
            }else if( obj.item && typeof obj.length === "number" ){
                result = class2type["object NodeList"];
            }else{
                result = key.slice(8, -1).toLowerCase();
            }
        }

        if( isType ){
            return result === isType.toLowerCase();
        }

        return result;
    }

    N.mix({
        type : type,

        isArray : function( arr ){
            return type( arr, "array" );
        },

        isArrarLike : function( arr ){
            var t = type( arr ),
                len = arr.length;

            return t === "array" || t !== "function" && 
                ( len === 0 || len > 0 && ( len-1 ) in arr );
        },

        isFunction : function( func ){
             return type( arr, "function" );
        },

        // 数组化
        toArray : function( array ){
            var i, ret = [];
            if( array != null ){
                i = array.length;
                if( i === undefined || type( array ) === 'string' || type( array ) === "function" ){
                    ret[0] = array;
                }else{
                    // 对于低版本的IE nodelist并不是继承于Object
                    if( array.item ){
                        while( i-- ){
                            ret[i] = array[i];
                        }
                    }else{
                        ret = slice.call(array)
                    }
                }
            }
            return ret;
        }
    });


/**************************模块方面的***************************************/

    var Model, // 公共接口对象（公共接口集） 
        modelLoaded = {},     // 已经加载的模块（加载的未执行的模块信息集）
        modelMap = {},        // 已经执行的模块脚本返回的对象（模块结果集）    
        requireDepReg = /N\.require\(\s*['"]([^'"\s]+)['"]\s*\)/, // 获取define第三参数函数的内部N.require加载的模块

        host = location.protocol,
        absUrl, // 初始的模块化 base 路径

    // 简单的获取一下script的链接url
    (function(){
        var scriptDoms = doc.getElementsByTagName('script'),
            len = scriptDoms.length,
            i = 0, scriptUrl, arr;

        while( absUrl === undefined && i < len ){
            if( scriptUrl = scriptDoms[i].src ){
                arr = scriptUrl.split('/');
                arr.pop();
                absUrl = arr.join('/') + '/';
            }
            i++;
        }

        if( absUrl === undefined  ){
            absUrl = location.origin;
        }
    })();

    /** 模块定义 define
    *   处理一下 2 种情况 参数
    *   不考虑循环依赖以及其他情况后期调整
    *   @method define
    *   @param {String} name 必选 模块名称
    *   @param {Array} deps 可选 依赖关系模块
    *   @param {Function} wrap 必选 模块函数实现
    *   @return {Object} 返回模块信息对象
    *   
    */
    var define = function(name, deps, wrap){
        var modelInfo = dealname(name),
            name = modelInfo["modelName"],
            modelload = modelLoaded[name];

        if( modelload ){
            N.console.log( name + " is defined !");
            return modelload;
        }

        if( !wrap ){
            wrap = deps;
            deps = [];     
        }

        if(wrap){
            wrap.toString().replace( requireDepReg, function(match, dep){
                deps.push(dep);
            });
        }

        modelload = {
            name : name,
            deps : deps,
            wrap : wrap
        }

        modelLoaded[name] = modelload;
        return modelload;
    },

    // 
    /** 模块预执行 execute
    *   对于已经加载的模块在依赖条件下将其执行，返回执行后的对象或者方法
    *  
    *   @method execute
    *   @param {String} name 必选 模块名称
    *   @return {Object} 返回模块执行完毕对象
    *   
    */
    execute = function( name ){
        var mExports = [],

            modelInfo = dealname(name),
            name = modelInfo["modelName"],
            url = modelInfo["modelUrl"],

            modelload = modelLoaded[name],
            model = modelMap[name];

        if( modelload === undefined ){ // 当模块文件还未加载的时候
            // 需要加载模块文件 loadscript
            // 应使用回调 加载完毕后 继续execute方法
            // return loadscript( modelUrl(name), execute(name) );
            N.console.log(name+" 文件构建有误，重新加载文件！");
            N.loadScript(url, function(){ 
                execute( name ); 
                console.log(name+" 文件加载运行完成！"); 
            });

        }else if( model ){
            N.console.log( name + " is defined !");
            return model;
        }else{
            each( modelload.deps, function(dep){
                mExports.push( execute( dep ) );
            });
            model = modelload.wrap.apply( this, mExports );
        }

        modelMap[name] = model;
        return model;
    }

    require = function( deps, wrap ){
        var models = [];
        if( wrap === undefined ){
            wrap = deps;
            deps = [];
        }
        each( deps, function(dep){
            models.push( execute( dep ) );
        });

        wrap.apply( null, models );
    }


    /** 规范化模块名 realname
    *   对于有地址信息的模块，提取出规范的模块名称
    *  
    *   @method realname
    *   @param {String} name 必选 模块名称id
    *   @return {Object} 返回规范的模块信息的对象
    *   
    */
    function dealname( name ){
        var infoArr = N.regRName.exec(name);

        return{
            modelName : infoArr[3],
            modelUrl : absUrl + (infoArr[2]===undefined ? "" : infoArr[2]) + infoArr[3] + ".js",
        }
    }

    function setAbsUrl( url ){
        absUrl =(/http|ftp|file/.test(url) ? url : host + "//" + url).replace(/\/\/?$/, '') + "/";
    }

    mix(N, {
        define : define,
        require : require,
        execute : execute,
        dealname : dealname,
        setAbsUrl : setAbsUrl
    });


/************************** 遍历函数 **************************************/

    /** 遍历执行 each
    *   遍历执行迭代函数
    *  
    *   @method each
    *   @param {Array|Object} arr 必选 需要遍历的数组或者对象
    *   @param {Array|Object} iterator 必选 需要迭代执行的函数
    *   @param {Array|Object} context 非必选 迭代函数执行的上下文 默认为N
    *
    *   @return undefined 无返回值
    *   
    */
    function each( array, iterator, context ){
        var value,i,len,
            forEach = ArrayProto.forEach;

        context = context||this;

        if(array == null) return;

        if(forEach && array.forEach === forEach){
            array.forEach(iterator, context);
        }else if( type(array) === 'array' ){
            for(i=0, len=array.length; i<len; i++){
                iterator.call(context, array[i], i, array);            
            }
        }else{
            for(var key in array){
                if(hasOwn.call(array, key)){
                    iterator.call(context, array[key], key, array);
                }
            }
        }
    }

    N.mix({
        each : each,

        /** 遍历执行 map
         *  遍历执行迭代函数并返回执行结果
         * 
         *  @method map
         *  @param {Array|Object} arr 必选 需要遍历的数组或者对象
         *  @param {Array|Object} iterator 必选 需要迭代执行的函数
         *  @param {Array|Object} context 非必选 迭代函数执行的上下文 默认为N
         *
         *  @return {Array} 返回执行结果数组
         *   
        */
        map : function map( array, iterator, context ){
            var value,i,len,newArr,
                map = ArrayProto.map;

            context = context||this;

            if(array == null) return;

            if(map && array.map === map){
                return array.map(iterator, context);
            }else if( type(array, 'array') ){
                newArr = [];
                for(i=0, len=array.length; i<len; i++){
                    newArr.push(iterator.call(context, array[i], i, array));            
                }
            }else{
                newArr = {};
                for(var key in array){
                    if(hasOwn.call(array, key)){
                        newArr[key] = iterator.call(context, array[key], key, array);
                    }
                }
            }
            return newArr;
        },

        /** 遍历判断 filter
         *  遍历执行迭代函数并返回符合函数条件的结果数组
         * 
         *  @method map
         *  @param {Array|Object} arr 必选 需要遍历的数组或者对象
         *  @param {Array|Object} iterator 必选 需要进行判断的函数
         *  @param {Array|Object} context 非必选 迭代函数执行的上下文 默认为N
         *
         *  @return {Array} 返回符合条件结果数组
         *   
        */
        filter : function( array, iterator, context ){
            var value,i,len,newArr,
                filter = ArrayProto.filter;

            context = context||this;

            if(array == null) return;

            if(filter && array.filter === filter){
                return array.filter(iterator, context);
            }else if( type(array, 'array') ){
                newArr = [];
                for(i=0, len=array.length; i<len; i++){
                    if( iterator.call(context, array[i], i, array) ){
                        newArr.push( array[i] );
                    }          
                }
            }else{
                newArr = {};
                for(var key in array){
                    if(hasOwn.call(array, key)){
                        if( iterator.call(context, array[key], key, array) ){
                            newArr[key] = array[key];
                        }
                    }
                }
            }
            return newArr;
        },

        /** 是否有符合条件的结果 some
         *  遍历执行迭代函数并返回true 或者 false
         * 
         *  @method map
         *  @param {Array|Object} arr 必选 需要遍历的数组或者对象
         *  @param {Array|Object} iterator 必选 需要进行判断的函数
         *  @param {Array|Object} context 非必选 迭代函数执行的上下文 默认为N
         *
         *  @return {bolean} 返回时候有item符合条件
         *   
        */
        some : function( array, iterator, context ){
            var value,i,len,
                some = ArrayProto.some;

            context = context||this;

            if(array == null) return;

            if(some && array.some === some){
                return array.some(iterator, context);
            }else if( type(array, 'array') ){
                for(i=0, len=array.length; i<len; i++){
                    if( iterator.call(context, array[i], i, array) === true ){
                        return true;
                    }          
                }
            }else{
                for(var key in array){
                    if(hasOwn.call(array, key)){
                        if( iterator.call(context, array[key], key, array) === true ){
                            return true;
                        }
                    }
                }
            }
            return false;
        },

        /** 是否所有符合条件 every
         *  遍历执行迭代函数并返回true 或者 false
         * 
         *  @method map
         *  @param {Array|Object} arr 必选 需要遍历的数组或者对象
         *  @param {Array|Object} iterator 必选 需要进行判断的函数
         *  @param {Array|Object} context 非必选 迭代函数执行的上下文 默认为N
         *
         *  @return {bolean} 返回是否所有item符合条件
         *   
        */
        every : function( array, iterator, context ){
            var value,i,len,
                every = ArrayProto.every;

            context = context||this;

            if(array == null) return;

            if(every && array.every === every){
                return array.every(iterator, context);
            }else if( type(array, 'array') ){
                for(i=0, len=array.length; i<len; i++){
                    if( iterator.call(context, array[i], i, array) === false ){
                        return false;
                    }          
                }
            }else{
                for(var key in array){
                    if(hasOwn.call(array, key)){
                        if( iterator.call(context, array[key], key, array) === false ){
                            return false;
                        }
                    }
                }
            }
            return true;
        },

        // 关于对象类型的均不采用鸭子辨别法 只用全等
        has : function( array, item ){
            var value,i,len;
            if(array == null) return;

            if( type(array) === 'array' ){
                for(i=0, len=array.length; i<len; i++){
                    if( array[i] === item ){
                        return true;
                    }         
                }
            }else{
                for(var key in array){
                    if(hasOwn.call(array, key) && array[key] === item){
                        return true;
                    }
                }
            }
            return false;
        }
    });

 
/**************************  调试方法 *************************************/
    /*
    *   简单的一个console兼容方法
    *
    */
    var console = (function(){
        var con = global.console,
            alert,alertFun;
        if( con === undefined ){
            alert = global.alert;
            alertFun = function( type ){
                return function( msg ){
                    alert( type +' : '+ msg );
                }
            };
            con = {
                log : alertFun('log'),
                error : alertFun('error')
            }
        }

        return con;
    })();

    N.mix({
        console : console
    });


/************************** 节点方法 **************************************/

    function createNode( tagName, attrs ){
        var node = doc.createElement(tagName);
        attrs = attrs || {};
        each(attrs, function(value, attr){
            node.setAttribute(attr, value);
        })
        return node;
    }

    N.mix({
        createNode : createNode,
        loadScript : function(url, callback){
            var regmsie = /(MSIE) ([\w.]+)/,
                node = createNode("script",{async:true,type:"text/javascript"});

            if( regmsie.test(userAgent) ){
                node.onreadystatechange = function(){
                    if(/complete|loaded/.test(node.readyState)){
                        node.onreadystatechange = null;
                        callback();
                    }
                }
            }else{
                node.onload = function(){
                    callback();
                }
            }

            node.src = url;
            head.appendChild(node);
        },

        // 由于火狐浏览器不支持link的onload事件，所以做回调较为复杂，需要轮询检测（lazyload中学到）
        // 并且对于css的话 回调函数意义不大，只提供异步加载功能
        loadCss : function(url){
            var node = createNode("link",{rel:"stylesheet",type:"text/css"});
            node.href = url;
            head.appendChild(node);
        },

        // 简单的 ready 方法
        ready : function( fn ){

            var isReady, isInited;

            function domReady(){

                if( isReady ) return;

                isReady = true;

                fn();
            }
            // 移除所有有关事件句柄 compeleted 的绑定事件
            function detach() { 
                if ( doc.addEventListener ) { 
                    doc.removeEventListener( "DOMContentLoaded", completed, false ); 
                    global.removeEventListener( "load", completed, false ); 
                } else { 
                    doc.detachEvent( "onreadystatechange", completed ); 
                    global.detachEvent( "onload", completed ); 
                } 
            } 

            // 对于已经过了 domReady 时间点
            function completed() { 
                // 标准浏览器 或者 为 IE下的load事件 或者 ready 状态为 complete（IE） 
                if ( doc.addEventListener || event.type === "load" || document.readyState === "complete" ) { 
                    detach(); 
                    domReady(); 
                } 
            } 

            if( isInited || doc.readyState === 'complete' ){
                // 暂时对 isInited 的情况简单处理
                setTimeOut(function(){
                    fn();
                });
            }else{
                
                if( isW3C ){
                    doc.addEventListener( "DOMContentLoaded", completed, false ); 
                    global.addEventListener( "load", completed, false ); 
                }else{
                    doc.attachEvent( "onreadystatechange", completed ); 
                    global.attachEvent( "onload", completed ); 

                    // IE的 doScroll 方式检测
                    var top = false; 
                    try { 
                        top = global.frameElement == null && doc.documentElement; 
                    } catch(e) {} 

                    if ( top && top.doScroll ) { 
                        (function doScrollCheck() { 
                            if ( !isReady ) { 
                                try { 
                                    top.doScroll("left"); 
                                } catch(e) { 
                                    return setTimeout( doScrollCheck, 50 ); 
                                } 

                                detach(); 
                                domReady(); 
                            } 
                        })(); 
                    } 
                } 
                
            }

            isInited = true;

        },

        noConflict : function(){
            global.N = _N;

            return N;
        }
    });



    global.define = N.define;
    global.require = N.require;
        
})(window);


/********************简单的使用文档************************

对象扩展对象方法
extend, mix, creatObject

数组化
toArray

基础工具：
isArray, isFunction, type, each, map, filter, some, every, creatNode, loadScript, loadCss

模块化方法
define, require, execute, dealname, setAbsUrl 

************************************************************/