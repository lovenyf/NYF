// 简单的 N 框架
// nyf 2013.7.1

// 实现模块加载化

(function(global, undefined){
    'use strict';

    // 大对象
    var O_N = global.N, //原始的 N 对象or属性
        N = global.N = {},
        NID = N.NID = "N"+ (+new Date()),

        doc = global.document,
        userAgent = navigator.userAgent,
        host = location.protocol,
        absUrl = location.origin;

    // 原型方法引用
    var ArrayProto = Array.prototype,
        ObjectProto = Object.prototype,
        StringProto = String.prototype,
        toString = ObjectProto.toString,
        hasOwn = ObjectProto.hasOwnProperty,
        slice = ArrayProto.slice,
        trimFunc = StringProto.trim,
        ltrimFunc = StringProto.trimLeft,
        rtrimFunc = StringProto.trimRight;

    // 正则集中
    var typeReg = /\[object (\w+)\]/;
    
    // 一些常用的常量
    var arrayType = "[object Array]",
        functionType = "[object Function]",
        objectType = "[object Object]",

        // 简单的浏览器UA检测正则
        regmsie = /(MSIE) ([\w.]+)/,
        regwebkit = /(AppleWebKit)[ \/]([\w.]+)/,
        regmsie = /(Opera)([\w.]+)/,
        regmsie = /(Gecko\/)([\w.]+)/,

        // 处理模块id 进行规范化处理正则
        regrname = /(?:\.?\/)?([\w\W]*\/)?([\w\W]*)/;



    /*********************************扩展继承*************************************/
    /** 对象扩展 extend
    *  
    *   @method extend
    *   @param {String} receiver 可选 扩展的目标对象 如果无 则扩展到外围为对象（一般为 N）
    *   @param {obj} obj 必选 要扩展到目标对象的对象数据
    *   @param {boolean} 可选 主要是标识是否需要深度拷贝 默认为true
    *
    *   @return {Object} 返回目标对象
    *   
    */
    function extend(receiver, obj){
        var args = slice.call(arguments), key,
            deep = (type(args[args.length-1]) === "boolean")?args.pop():true;

        obj = args[args.length-1];

        if(args.length == 1){
            receiver = this;
        }
        for( key in obj ){
            if(hasOwn.call(obj, key)){
                if(!hasOwn.call(receiver,key)){
                    if( deep && (type(obj[key])==="object" || type(obj[key])==="array")){
                        receiver[key]={};
                        extend(receiver[key], obj[key]);
                    }else{
                        receiver[key] = obj[key];
                    }
                }else{                    
                    throw new Error("sorry "+key+" is already in the receiver object");
                }
            }
        }
        return receiver;
    }


    /** 对象扩展 mix
    *   简单来说是属于extend的简单形式，不进行深度拷贝 并且目标对象为必选
    *   @method mix
    *   @param {String} target 必选 扩展的目标对象
    *   @param {obj} obj 必选（可有多个） 要扩展到目标对象的对象数据
    *   
    *   @return {Object} 返回目标对象
    *   
    */
    function mix(target, obj){
        var args = slice.call(arguments), i=1, len=args.length, key;
        for(;i<len;i++){
            obj = args[i];
            for(key in obj){
                if(hasOwn.call(obj, key)){
                    if(!hasOwn.call(target, key)){
                        target[key] = obj[key];
                    }else{
                        throw new Error("sorry "+key+" is already in the receiver object");
                    }
                }
            }
        }
    }

    // 用于使用来继承扩展对象
    var createObject = (function(){
        function F(){};
        return function(obj){
            F.prototype = obj;
            F.prototype.constructor = obj;
            return new F();     
        }
    }());

    mix(N, {
        extend : extend,
        mix : mix,
        createObject : createObject
    });



    /**************************模块方面的***************************************/

    var Model, // 公共接口对象（公共接口集） 
        modelLoaded = {},     // 已经加载的模块（加载的未执行的模块信息集）
        modelMap = {};        // 已经执行的模块脚本返回的对象（模块结果集）    

    /** 模块定义 define
    *   处理一下 2 种情况 参数
    *  
    *   @method define
    *   @param {String} name 必选 模块名称
    *   @param {Array} deps 可选 依赖关系模块
    *   @param {Function} wrap 必选 模块函数实现
    *   @return {Object} 返回模块信息对象
    *   
    */
    function define(name, deps, wrap){
        var modelInfo = dealname(name),
            name = modelInfo["modelName"],
            model = modelLoaded[name];

        if( model ){
            return model;
        }

        if( !wrap ){
            wrap = deps;
            deps = [];     
        }

        model = {
            name : name,
            deps : deps,
            wrap : wrap
        }

        modelLoaded[name] = model;
        return model;
    }

    // 
    /** 模块预执行 execute
    *   对于已经加载的模块在依赖条件下将其执行，返回执行后的对象或者方法
    *  
    *   @method execute
    *   @param {String} name 必选 模块名称
    *   @return {Object} 返回模块执行完毕对象
    *   
    */
    function execute( name ){
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
            console.log(name+" 文件构建有误，重新加载文件！");
            loadScript(url, function(){ 
                execute( name ); 
                console.log(name+" 文件加载运行完成！"); 
            });

        }else if( model ){
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

    function require( name ){
        return execute(name);
    }

    Model = {
        define : define,
        require : require,
        execute : execute
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
        var infoArr = regrname.exec(name);
        return{
            modelName : infoArr[2],
            modelUrl : absUrl + (infoArr[1]===undefined ? "/" : "/"+infoArr[1]) + infoArr[2] + ".js",
        }
    }

    function setAbsUrl( url ){
        absUrl =/http|ftp|file/.test(url) ? url : host + "//" + url;
    }

    mix(N, {
        define : define,
        require : require,
        execute : execute,
        dealname : dealname,
        setAbsUrl : setAbsUrl
    });



    /************************** 底层基础工具函数 **************************************/
    /*   isArray  isFunction type  检测目标类型
    *   each map  迭代循环
    *   createNode 创建node对象
    *   loadScript 加载脚本文件
    *
    *
    */

    function isArray(arr){
        return toString.call(arr) === arrayType;
    }

    function isFunction(func){
        return toString.call(func) === functionType;
    }

    function type(obj){
        return (typeof obj === "object"?
                (obj===null ? "null" : typeReg.exec(toString.call(obj))[1].toLowerCase()) :
                typeof obj);
    }

    mix(N, {
        isArray : isArray,
        isFunction : isFunction,
        type : type
    });



    function each( array, iterator, context ){
        var value,i,len,
            forEach = ArrayProto.forEach;

        context = context||this;

        if(array == null) return;

        if(forEach && array.forEach === forEach){
            array.forEach(iterator, context);
        }else if( isArray(array) ){
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

    // 
    function map( array, iterator, context ){
        var value,i,len,newArr,
            map = ArrayProto.map;

        context = context||this;

        if(array == null) return;

        if(map && array.map === map){
            return array.map(iterator, context);
        }else if( isArray(array) ){
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
    }

    function filter( array, iterator, context ){
        var value,i,len,newArr,
            filter = ArrayProto.filter;

        context = context||this;

        if(array == null) return;

        if(filter && array.filter === filter){
            return array.filter(iterator, context);
        }else if( isArray(array) ){
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
    }

    mix(N, {
        each : each,
        map : map,
        filter : filter
    });

    function createNode( tagName, attrs ){
        var node = doc.createElement(tagName);
        attrs = attrs || {};
        each(attrs, function(value, attr){
            node.setAttribute(attr, value);
        })
        return node;
    }

    function loadScript(url, callback){
        var node = createNode("script",{async:true,type:"text/javascript"}),
            head = loadScript.head = loadScript.head || doc.getElementsByTagName("head")[0];

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
    }

    // 由于火狐浏览器不支持link的onload事件，所以做回调较为复杂，需要轮询检测（lazyload中学到）
    // 并且对于css的话 回调函数意义不大，只提供异步加载功能
    function loadCss(url){
        var node = createNode("link",{rel:"stylesheet",type:"text/css"}),
            head = loadCss.head = loadCss.head || doc.getElementsByTagName("head")[0];

        node.href = url;
        head.appendChild(node);
    }

    mix(N, {
        createNode : createNode,
        loadScript : loadScript,
        loadCss : loadCss
    });


    var trim, ltrim, rtrim;

    if( trimFunc ){
        trim = function( str ){ return str.trim(); };
        ltrim = function( str ){ return str.trimLeft(); }; 
        rtrim = function( str ){ return str.trimRight(); };
    }else{
        trim = function( str ){ return str.rplace(/^\s+|\s+$/g, '') };
        ltrim = function( str ){ return str.rplace(/^\s+/g, '') }; 
        rtrim = function( str ){ return str.rplace(/\s+$/g, '') };
    }

    mix(N, {
        trim : trim,
        ltrim : ltrim,
        rtrim : rtrim
    });


        
})(window);


/********************简单的使用文档************************
基础工具：
isArray, isFunction, type, each, map, creatNode, loadScript, loadCss


对象扩展对象方法
extend, mix, creatObject


模块化方法
define, require, execute, dealname, setAbsUrl 

************************************************************/