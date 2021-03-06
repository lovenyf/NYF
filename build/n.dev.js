/*! n 2014-07-15 by yingfeng */
// 简单的 N 框架

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


    // 简单的浏览器UA检测正则
    var regmsie = /(MSIE) ([\w.]+)/,
        regwebkit = /(AppleWebKit)[ \/]([\w.]+)/,
        regOpera = /(Opera)([\w.]+)/,
        regGecko = /(Gecko\/)([\w.]+)/;

/********************************* 正则表达 *************************************/
    mix( N, {
        sStringReg : /[^, ]+/g,

        // 处理模块id 进行规范化处理正则
        regRName : /(?:\.?\/)?([\w\W]*\/)?([\w\W]*)/
    });

/********************************* 扩展继承 *************************************/
    /** 对象扩展 extend
    *  
    *   @method extend  不扩展原型属性
    *   @param {obj} receiver 可选 扩展的目标对象 如果无 则扩展到外围为对象（一般为 N）
    *   @param {obj} obj 必选 要扩展到目标对象的对象数据
    *   @param {boolean} ride 可选 主要是标识是否覆盖原有对象属性 默认为true
    *   @param {boolean} deep 可选 主要是标识是否需要简单的深度拷贝 默认为true
    *
    *   @return {Object} 返回目标对象
    *   
    */
    function extend(receiver, obj){
        var args = slice.call(arguments), key, i = 1,
            deep, ride;

        if( type(args[args.length-2]) === "boolean" ){
            deep = args.pop();
            ride = args.pop();
        }else{
            ride = (type(args[args.length-1]) === "boolean")?args.pop():true;
            deep = true;
        }

        if(args.length == 1){
            receiver = ( this !== global ) ? this : {};
        }

        while( obj = args[ i++ ] ){
            for( key in obj ){
                if(hasOwn.call(obj, key)){
                    if( !ride && hasOwn.call(receiver,key) ){                    
                        throw new Error("sorry "+key+" is already in the receiver object");
                    }else{
                        if( deep && (type(obj[key])==="object")){
                            receiver[key]={};
                            extend(receiver[key], obj[key], ride, deep);
                        }else if( deep && (type(obj[key])==="array" )){
                            receiver[key] = obj[key].slice();
                        }else{
                            receiver[key] = obj[key];
                        }
                    }

                }
            }
        }
            
        return receiver;
    }

    /** 对象扩展 mix
    *   简单来说是属于extend的简单形式，不进行深度拷贝 并且目标对象为可选 默认当前调用对象
    *   @method mix  主要适用于N内部的属性扩展简便方法
    *   @param {obj} target 可选 扩展的目标对象
    *   @param {obj} obj 必选（可有多个） 要扩展到目标对象的对象数据
    *   
    *   @return {Object} 返回目标对象
    *   
    */
    function mix(target, obj){
        var args = slice.call( arguments );
        if( args.length === 1 ){
            args.unshift( this );
        }
        args.push( true, false );
        extend.apply(this, args)
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


/*********************************数组化*************************************/
    function toArray( array ){
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

    mix(N, {
        toArray : toArray
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
        var infoArr = N.regRName.exec(name);
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
    *   each map  filter some every迭代循环
    *   createNode 创建node对象
    *   loadScript 加载脚本文件
    *
    *
    */

/************************** 类型判定 **************************************/
    
    // 类型判定对象
    var class2type = {
        "[objectHTMLDocument]" : "document",
        "[objectHTMLCollection]" : "nodeList",
        "[objectStaticNodeList]" : "nodeList",
        "[objectIXMLDOMNodeList]" : "nodeList",
        "null" : "null",
        "NaN" : "NaN",
        "undefined" : "undefined"
    };

    "Boolean, Number, String, Function, Array, Date, RegExp, Document, Arguments, NodeList"
        .replace( N.sStringReg, function( type ){
            class2type["[object " + type + "]"] = type.toLowerCase();
        } );

    // 是否为数组
    function isArray( arr ){
        return type( arr, "array" );
    }

    function isArrarLike( arr ){
        var t = type( arr ),
            len = arr.length;

        return t === "array" || t !== "function" && 
            ( len === 0 || len > 0 && ( len-1 ) in arr );
    }

    // 是否为函数
    function isFunction( func ){
         return type( arr, "function" );
    }

    // 类型判定
    function type( obj, isType ){
        var key = ((obj == null || obj !== obj ) ? obj + "" : toString.call( obj )),
            result;
        
        if( typeof(result = class2type[ key ]) !== "string" ){
            if( obj.nodeType === 9 ){
                result = class2type["Document"];
            }else if( obj.item && typeof obj.length === "number" ){
                result = class2type["NodeList"];
            }else{
                result = key.slice(8, -1);
            }
        }

        if( isType ){
            return result === isType.toLowerCase;
        }

        return result;
    }

    mix(N, {
        isArray : isArray,
        isFunction : isFunction,
        type : type
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

    /** 遍历执行 map
    *   遍历执行迭代函数并返回执行结果
    *  
    *   @method map
    *   @param {Array|Object} arr 必选 需要遍历的数组或者对象
    *   @param {Array|Object} iterator 必选 需要迭代执行的函数
    *   @param {Array|Object} context 非必选 迭代函数执行的上下文 默认为N
    *
    *   @return {Array} 返回执行结果数组
    *   
    */
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

    /** 遍历判断 filter
    *   遍历执行迭代函数并返回符合函数条件的结果数组
    *  
    *   @method map
    *   @param {Array|Object} arr 必选 需要遍历的数组或者对象
    *   @param {Array|Object} iterator 必选 需要进行判断的函数
    *   @param {Array|Object} context 非必选 迭代函数执行的上下文 默认为N
    *
    *   @return {Array} 返回符合条件结果数组
    *   
    */
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

    /** 是否有符合条件的结果 some
    *   遍历执行迭代函数并返回true 或者 false
    *  
    *   @method map
    *   @param {Array|Object} arr 必选 需要遍历的数组或者对象
    *   @param {Array|Object} iterator 必选 需要进行判断的函数
    *   @param {Array|Object} context 非必选 迭代函数执行的上下文 默认为N
    *
    *   @return {bolean} 返回时候有item符合条件
    *   
    */
    function some( array, iterator, context ){
        var value,i,len, flog = false,
            some = ArrayProto.some;

        context = context||this;

        if(array == null) return;

        if(some && array.some === some){
            return array.some(iterator, context);
        }else if( isArray(array) ){
            for(i=0, len=array.length; i<len; i++){
                if( iterator.call(context, array[i], i, array) === true ){
                    flog = true;
                    break;
                }          
            }
        }else{
            for(var key in array){
                if(hasOwn.call(array, key)){
                    if( iterator.call(context, array[key], key, array) === true ){
                        flog = true;
                        break;
                    }
                }
            }
        }
        return flog;
    }

    /** 是否所有符合条件 every
    *   遍历执行迭代函数并返回true 或者 false
    *  
    *   @method map
    *   @param {Array|Object} arr 必选 需要遍历的数组或者对象
    *   @param {Array|Object} iterator 必选 需要进行判断的函数
    *   @param {Array|Object} context 非必选 迭代函数执行的上下文 默认为N
    *
    *   @return {bolean} 返回是否所有item符合条件
    *   
    */
    function every( array, iterator, context ){
        var value,i,len, flog = true,
            every = ArrayProto.every;

        context = context||this;

        if(array == null) return;

        if(every && array.every === every){
            return array.every(iterator, context);
        }else if( isArray(array) ){
            for(i=0, len=array.length; i<len; i++){
                if( iterator.call(context, array[i], i, array) === false ){
                    flog = false;
                    break;
                }          
            }
        }else{
            for(var key in array){
                if(hasOwn.call(array, key)){
                    if( iterator.call(context, array[key], key, array) === false ){
                        flog = false;
                        break;
                    }
                }
            }
        }
        return flog;
    }

    // 关于对象类型的均不采用鸭子辨别法 只用全等
    function has( array, item ){
        var value,i,len;
        if(array == null) return;

        if( isArray(array) ){
            for(i=0, len=array.length; i<len; i++){
                if( array[i] === item ){
                    return true;
                }         
            }
        }else{
            for(var key in array){
                if(hasOwn.call(array, key)){
                    return true;
                }
            }
        }
        return false;
    }

    mix(N, {
        each : each,
        map : map,
        filter : filter,
        some : some,
        every : every,
        has : has
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
        trim = function( str ){ return str.replace(/^\s+|\s+$/g, '') };
        ltrim = function( str ){ return str.replace(/^\s+/g, '') }; 
        rtrim = function( str ){ return str.replace(/\s+$/g, '') };
    }

    mix(N, {
        trim : trim,
        ltrim : ltrim,
        rtrim : rtrim
    });


    //global.define = N.define;
    //global.require = N.require;
        
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
// 扩展selector 类似于 简单的DOM选择器
// 返回为 DOM对象数组形式 目前只支持单层的查找
// $(".classname") & $("#id") & $("#id1,#id2")
// 并不是为了实现如JQ中的选择器，实现一些简单的选择器功能 相当简单
// 之后需要扩展实现 简单的层级查找 $("#id .classname")

N.define("$", ["arrayUtil"], function( arrayUtil ){

    'use strict';
    var objPro = Object.prototype,
        arrPro = Array.prototype,
        toString = objPro.toString,
        hasOwn = objPro.hasOwnProperty,
        slice = arrPro.slice,
        w = window,
        d = w.document,

        each = N.each,
        extend = N.extend,
        trim = N.trim,
        filter = N.filter,
        isArray = N.isArray;

    // 几个基本选择器方法
    function getDomObj(str, root){
        if(root.querySelectorAll){
                return slice.call(root.querySelectorAll(str));  //使用内置方法
        }else{
            if(str.indexOf("#")){
                str = str.slice(1);    
                return [d.getElementById(str)];
            }else if(str.indexOf(".")){
                str = str.slice(1);    
                return getByClass(str,root);
            }else{
                return slice.call(root.getElementsByTagName(str));
            }
        } 
    }

    function getByClass(classname, root){
        var elements, doms = [],  len;
        if(root.getElementsByClassName){
            return slice.call(root.getElementsByClassName(classname))
        }else{
            elements = root.getElementsByTagName("*");
            len = elements.length;

            each(elements, function(ele){
                if((" " + ele.classname + " ").indexof(" "+str+" ") !== -1){
                    doms.push(ele);
                }
            });
            return doms;
        }
    }

    // 转化类数组形似的 each
    function likeArrayEach( nObj, iterator, context){
        var arr = [], i, len = nObj.length;

        for (i=0; i<len; i++) {
            if( nObj[i] ){
                arr[i] = nObj[i]; 
            }
        };

        each( arr, iterator, context )
    }

    function dealClass( classStr ){
        var classesName = [],
            classStr = trim( classStr );

        return classStr.split(/\s+/g);
    }

    //为了可以继承DOM的一般方法，将DOM数组信息放入实例对象中
    function markNObject( array, obj ){
        for( var i=0,len=array.length; i<len; i++ ){
            obj[i] = array[i];
        }
        obj.length = len;
        return obj;
    }


    /** 微型选择器 $
    *  
    *   @method $ 目前只支持简单的复合选着 如$("#id, .classname") & $("#id") & $("#id1,#id2")
    *           暂不支持层级选着 如 $("#id tag")
    *   @param {String} str 必选，选择字符串
    *   @param {Object} obj 可选 选择节点的区域
    *   
    *   @return {Array} 返回目标DOM对象数组
    *   
    */
    function $(str,root){                   // $(".classname") & $("#id") & $("#id1,#id2")
        var elements = [],                  // 分割后的数组
            ele_len = 0,                    // 数组长度
            reg_spl = /\s*,\s*/,            // 截取 
            reg_white = /^\s+|\s+$/,
            dom_obj = {},                   // dom 对象
            ret = [],                       // 返回的dom对象
            root = root || d,
            element,i,name;    

        // 参数为DOM对象
        if(str.nodeType){ 
            this[0] = str;
            this.length = 1;
            return this; 
        }

        //不为string返回空数组
        if(typeof str !== "string"){ 
            this.length=0;
            return this; 
        } 

        // 单个情况
        if(str.indexOf(",") === -1){
            return markNObject( getDomObj(str,root), this);
        }  

        elements = str.split(reg_spl);
        ele_len = elements.length;

        for(i = 0; i<ele_len; i++){
            dom_obj = getDomObj(elements[i],root);
            ret = ret.concat(dom_obj);
        }
    
        return markNObject( ret, this);
    }

    $.prototype = {
        constructor : $,

        addClass : function( classes ){
            var self = this;
            if( !isArray(classes) ){
                classes = [classes];
            }

            likeArrayEach( self, function( dom ){
                var classStr = dom.className,
                    oldclasses = dealClass( classStr ),
                    newclasses;

                    newclasses = arrayUtil.mergeRepeatArray( classes, oldclasses );

                    dom.className = newclasses.join(" ");
            } );

            return this;
        },
        deleteClass : function( classes ){
            var self = this;
            if( !isArray(classes) ){
                classes = [classes];
            }

            likeArrayEach( self, function( dom ){
                var classStr = dom.className,
                    oldclasses = dealClass( classStr ),
                    newclasses;

                    newclasses = arrayUtil.deleteRepeat( oldclasses, classes );

                    dom.className = newclasses.join(" ");
            } );

            return this;
        },

        hide : function(){
            var self = this;
            markNObject( self, function( dom ){
                dom.style.display = "none";
            } );

            return this;
        },
        show : function(){
            var self = this;
            markNObject( self, function( dom ){
                dom.style.display = "block";
            } );

            return this;
        }
    }


    // 重点为这个方法，对于在候选集中进行过滤
    //function filter(target, factor, str){}

    // 在一个选择器表达式中 最优化的选出候选集

    return function(str, root){
        return new $(str,root);
    }

});
// Ajax 模块

// var ajax = N.execute("ajax");
// ajax.ajax( method, url, {
//  data:{},
//  success:function(){},
//  faile:function(){}
// });

// ajax.get(), ajax.post(), ajax.put(), ajax.delete()


N.define( "ajax", function(){

    // 创建 XMLHttpRequest 兼容对象
    function xhr(){
        var http;

        if( window.XMLHttpRequest ){
            http = new XMLHttpRequest();
            xhr = function(){
                return new XMLHttpRequest();
            }
        }else if( window.ActiveXObject ){
            try{
                http = new ActiveXObject("Msxml2.XMLHTTP");
                xhr = function(){
                    return new ActiveXObject("Msxml2.XMLHTTP");
                }
            }catch(e){
                http = new ActiveXObject("Microsoft.XMLHTTP");
                xhr = function(){
                    return new ActiveXObject("Microsoft.XMLHTTP");
                }
            }
        }

        return http;
    }

    // 将对象转化为URI方式的数据
    function encode( data ){
        
        var resultStr ="",
            encodeURI = encodeURIComponent,
            key;

        if( typeof data === "string" ){
            resultStr = encodeURI(data);
        }else{
            for ( key in data ) {
                if( data.hasOwnProperty( key ) ){
                    resultStr += "&" + encodeURI(key) + "=" +encodeURI(data[key]);
                } 
            }; 
        }

        return resultStr;
    }


    /** ajax主体方法 Ajax
    *   @method Ajax ajax的兼容方法
    *   @param {String} method 必选 请求方式
    *   @param {String} url 必选 请求地址
    *   @param {Object} options 可选 请求参数
    *       @param {Object | String} data 需要载入请求的数据
    *       @param {Function} success 请求成功的回调函数
    *       @param {Function} faile 请求失败的回调函数
    */
    function Ajax(method, url, options){
        var XHR, predata, success, faile;

        options = options || {},
        data = options.data || {}
        success = options.success,
        faile = options.faile,
        headers = headers ||{},
        XHR = xhr(),
        predata = encode(data);

        if( method === "GET" && predata){
            url += "?" + predata;
            predata = null;
        }

        XHR.open( method, url );

        XHR.setRequestHeader('Content-type','application/x-www-form-urlencoded');
        for (var header in headers) {
            if (headers.hasOwnProperty(header)) {
                xhr.setRequestHeader(header, headers[header]);
            }
        }

        XHR.onreadystatechange = function(){
            var err;

            if( XHR.readyState === 4 ){
                var ok = (( XHR.status >= 200 && XHR.status < 300) ||
                           XHR.status === 304);
                
                if( ok && success){
                    success( XHR.resposeText, XHR );
                }else if( !ok && faile ){
                    faile( XHR.resposeText, XHR );
                }
            }
        }

        XHR.send( predata );
    }

    function _Ajaxer( method ){
        return function( url, options ){
            return Ajax(method, url, options);
        }
    }

    var ajax = {
        ajax : Ajax,
        get : _Ajaxer("GET"),
        post : _Ajaxer("POST"),
        put : _Ajaxer("PUT")
    };

    return ajax;
});
// 集中一些对于数组的处理方法 参考一下 underscore
// dealRepeat 合并多个数组去除重复元素
// shuffle 将数组元素随机打乱

N.define("arrayUtil", function(){
    var each = N.each,
        isArray = N.isArray,
        slice = Array.prototype.slice;

    /** 合并多个数组去除重复元素 mergeRepeatArray
    *  
    *   @method mergeRepeatArray
    *   @param {array} arrays 需要去重合并的 数组 组
    *   @return {Object} 返回合并去重的数组
    *   
    *   dealRepeat([1,2,3],[2,5,6]); return [1,2,3,5,6]
    */
    function mergeRepeatArray(){
        var keyObj = {},
            finalArr = [],
            arrays = slice.call( arguments );

        each( arrays, function( array ){
            each(array, function( item ){
                if( keyObj[item] === undefined ){
                    keyObj[item] = true;
                    finalArr.push( item );
                }
            });
        });

        return finalArr;

    }

    /** 对原数组去除重复元素 deleteRepeat
    *  
    *   @method deleteRepeat
    *   @param {array} originArr 需要去重的原数组
    *   @param {array} deleteArr 需要去除的元素数组
    *   @return {Object} 返回合并去重的数组
    *   
    *   dealRepeat([1,2,3],[2,4]); return [1,3]
    */
    function deleteRepeat( originArr, deleteArr ){
        var targetArr=[],delObj = {}, i , len;
        for(i=0,len=deleteArr.length; i<len; i++){
            delObj[ deleteArr[i] ] = true;
        }

        for(i=0,len=originArr.length; i<len; i++ ){
            if( delObj[ originArr[i] ] !== true){
                targetArr.push(originArr[i]);
            }
        }

        return targetArr;

    }

    /** 随机重排序数组元素 shuffle
    *  
    *   @method shuffle
    *   @param {array} array 需要随机重排序的数组
    *   @return {Object} 返回合并去重的数组
    *   
    *   shuffle([1,2,3,5,6]); return [3,2,6,5,1]
    */
    function shuffle( array ){
        var len = array.length,
            shuffled = array.slice(),
            random;

        each( array, function( item, i ){
            var random = Math.randon() * len >>> 0;
            shuffled[i] = shuffled[random];
            shuffled[random] = item;
        } );

        return shuffled;
    }

    return {
        mergeRepeatArray : mergeRepeatArray,
        deleteRepeat : deleteRepeat,
        shuffle : shuffle
    }
});
// 对于数据的处理，以闭包形式保存数据
// 借用 JQ 的模式，来处理普通对象和DOM对象的不同处理


N.define( "data", function(){
    var cache = [],
        uid = -1,
        NID = N.NID,
        type = N.type,
        extend = N.extend;

    /** 数据处理 data
    *   @method data 实现对于数据的集中存储，主要用来分离对DOM对象绑定数据的情况
    *                普通对象依旧不做处理
    */
    function data( obj, key, value ){
        var uNumber, dObject;
        if(obj.nodeType){
            uNumber = (obj[NID] !== undefined) ? obj[NID] : (obj[NID] = ++uid) ;
            dObject = cache[uNumber] || (cache[uNumber]={});
        }else{
            dObject = obj;
        }

            /*if(obj[NID]){
                uNumber = obj[NID];
            }else{
                uNumber = obj[NID] = ++uid;
                cache[uNumber]={}
            }*/

        if(type(value) === "undefined"){
            return dObject[key];
        }else if(type(value) === "object" || type(value) === "array") {  // 这边貌似还是不能放在一起
            dObject[key] = {};
            extend(dObject[key], value);
        }else{
            dObject[key] = value;
        }
       

    }

    function removeData( obj, key ){
        var uNumber = obj[NID];
        
        if(obj.nodeType){
            
            if(uNumber === undefined) return;

            if(key){
                delete cache[uNumber][key];
            }else{
                cache[uNumber] = undefined;
            }
        }else{
            delete obj[key];
        }
    }

    return {
        data : data,
        removeData : removeData
    }
});
// N 框架的 事件 模块
// bind unbind fire clean stop

N.define("event",["data"],function(data){
    "use strict"
    var doc = document,
        NID = N.NID,
        mouseEventRe = /^(?:mouse)|click/;


    // 事件绑定的兼容方法
    var addEvent = (function(){
        if( doc.addEventListener ){
            return function( target, name, handler, capture ){
                target.addEventListener(name, handler, capture || false)
            } 
        }else if( doc.attachEvent ){
            return function( target, name, handler ){
                target.attachEvent("on"+name, handler);
            }
        }else{
            return function( target, name, handler ){
                target["on"+name] = handler;
            }
        }
    })();

    var removeEvent = (function(){
        if( doc.removeEventListener ){
            return function( target, name, handler, capture ){
                target.removeEventListener(name, handler, capture || false)
            } 
        }else if( doc.detachEvent ){
            return function( target, name, handler ){
                target.detachEvent("on"+name, handler);
            }
        }else{
            return function( target, name ){
                target["on"+name] = null;
            }
        }
    })();

    // 简单的处理事件的属性值兼容
    function fixEvent(oEvent, data){
        var name, event = data || {}, undef;

        function returnFalse(){
            return false;
        }

        function returnTure(){
            return true;
        }

        for(name  in  oEvent){
            event[name] = oEvent[name];
        }

        if(!event.target){
            event.target = event.srcElement || doc;
        }

        if (originalEvent && mouseEventRe.test(oEvent.type) && oEvent.pageX === undef && oEvent.clientX !== undef) {
            var eventDoc = event.target.ownerDocument || document;
            var doc = eventDoc.documentElement;
            var body = eventDoc.body;

            event.pageX = oEvent.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0 ) -
                ( doc && doc.clientLeft || body && body.clientLeft || 0);

            event.pageY = oEvent.clientY + (doc && doc.scrollTop  || body && body.scrollTop  || 0 ) -
                ( doc && doc.clientTop  || body && body.clientTop  || 0);
        }

        event.preventDefault = function(){
            event.isPreventedDefault = returnTure;

            // 主要 event 是完全拷贝了 oEvent，而不是引用 对于阻止默认事件还需要在oEvent上进行
            if(oEvent){
                if(oEvent.preventDefault){
                    oEvent.preventDefault();
                } else {
                    oEvent.returnValue = false;
                }
            }
        }

        event.stopPropagation = function(){
            event.isStopedPropagation = returnTure;

            if(oEvent){
                if(oEvent.stopPropagation){
                    oEvent.stopPropagation();
                } else {
                    oEvent.cancelBubble = true;
                }
            }
        }

        event.stop = function(){
            event.preventDefault();
            event.stopPropagation();
        }

        return event;
    }

    // 兼容处理 DomOnReady 事件
    function onReady(win, callback, eUtils){
        var doc = win.document, event = {type : 'ready'};

        if( eUtils.domLoaded ){
            callback(event);
            return;
        }

        // DOM ready 的事件句柄
        function readyHandler(){
            if( !eUtils.domLoaded ){
                eUtils.domLoaded = true;
                callback(event);
            }
        }

        function waitForDomLoaded(){
            if( doc.readyStatus === "complete" ){
                removeEvent( doc, "readystatechange", waitForDomLoaded );
                readyHandler();
            }
        }

        // IE 早期浏览器可以使用的判断DOMReady的替代方法
        function tryScroll(){
            try{
                doc.documentElement.doScroll("left");
            }catch(ex){
                setTimeout(tryScroll, 0);
                return;
            }

            readyHandler();
        }

        // W3C method
        if ( doc.addEventListener ){
            addEvent( win, 'DOMContentLoaded', readyHandler );
        } else {
            // IE method
            addEvent( doc, 'readystatechange', waitForDomLoaded );
            
            // 当IE下的另一种方式
            if( doc.documentElement.doScroll && win === win.top ){
                tryScroll();
            }
        }

        // 以上均失败的时候
        addEvent( win, 'load'. readyHandler );
    }
    
    // 事件 类
    function eUtils(){
        var self = this;

        self.domLoaded = false;

        function execHandlers(event, cache){
            var callbackList, i, l, callback;

            callbackList = cache[event.type];
            if( callbackList ){
                for( i=0, l=callbackList.length; i<l;i++ ){
                    callback = callbackList[i];

                    if( callback && callback.func.call( callback.scope, event ) === false ){
                        event.preventDefault();
                    }

                }
            }
        }

        /**
         * 对目标对象绑定 对于事件处理程序的事件句柄 被放在 data 数据 cache 中的 events 属性之中
         *
         * @method bind
         * @param {Object} target DOM节点或者其他对象
         * @param {String} names 事件名称,可以为数组形式
         * @param {function} callback 需要绑定的事件句柄
         * @param {Object} scope 回调函数所需要执行于。。。的作用域
         * @return 
         */
        self.bind = function( target, name, callback, scope ){
            var cacheID, cache, callbackList,
                callback = {
                    func : callback,
                    scope : scope || target
                };

            function nativeHandler( e ){
                e = fixEvent( e || window.event );
                e.type = e.type === 'focus' ? 'focusin' : 'focusout';
                execHandlers( e, cache );
            }

            target[NID] ? cacheID = target[NID] : data( target, 'event', {} ),
            cache = data.data(cacheID)['event'];
            callbackList = cache[name] || [];

            if( !callbackList ){
                addEvent( target, name, nativeHandler, false );
            }else{
                callbackList.push(callback);  
            }

            // 清理IE下内存问题
            target = callbackList = null;

            return callback;
        };


        /**
         * 对目标对象解除绑定
         *
         * @method bind
         * @param {Object} target DOM节点或者其他对象
         * @param {String} names 事件名称,可以为数组形式
         * @param {function} callback 需要解除绑定的事件句柄
         * @return 
         */
        self.unbind = function( target, name, callback ){
            var cacheID, cache, callbackList, i, len;

            cacheID = target[NID];

            if( !(cacheID = target[NID]) || !(cache = data.data(cacheID)['event']) || !(callbackList = cache[name]))
                 return ;

            for( i=0, len=callbackList.length; i<len; i++ ){
                if( callbackList[i]['func'] === callback ){
                    callbackList.splice(i, 1);
                    return;
                }
            }
        }


        /**
         * 对目标对象触发特定事件
         *
         * @method bind
         * @param {Object} target DOM节点或者其他对象
         * @param {String} name 事件名称
         * @return 
         */
        self.fire = function( target, name ){
            var cacheID, cache, callbackList, simulateE;

            cacheID = target[NID];

            if( !(cacheID = target[NID]) || !(cache = data.data(cacheID)['event']) || !(callbackList = cache[name]))
                 return ;

            simulateE = { type : name };

            execHandlers(simulateE, cache);

        }

        // 清空对象或者对象下某一事件的事件队列
        self.clean = function( target, name ){
            var cacheID, cache, callbackList, simulateE;

            cacheID = target[NID];

            if( !(cacheID = target[NID]) || !(cache = data.data(cacheID)['event']))
                return ;

            if( name ){
                // 清空name事件的事件队列
                cache[name] = name;
            }else{
                data.removeData(target, 'event');
            }

        }

        self.stop = function( e ){
            e = fixEvent( e || window.event );
            e.stop();
        }

    }

    var eutils = new eUtils();

    return eutils;

});