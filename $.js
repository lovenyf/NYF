// 扩展selector 类似于 简单的DOM选择器
// 返回为 DOM对象数组形式
// $(".classname") & $("#id") & $("#id1,#id2")
// 并不是为了实现如JQ中的选择器，实现一些简单的选择器功能 相当简单
// （ 摔 说穿了就是老子实现不了 TAT ）
// 之后需要扩展实现 简单的层级查找 $("#id .classname")

N.define("$",function(){
    var toString = Object.prototype.toString,
        hasOwn = Object.prototype.hasOwnProperty,
        slice = Array.prototype.slice,
        w = window,
        d = w.document;

    function $(str,root){   // $(".classname") & $("#id") & $("#id1,#id2")
        var elements = [],  // , 分割后的数组
            ele_len = 0,  // 数组长度
            reg_spl = /\s*,\s*/, // 截取  ，
            dom_obj = {}, // dom 对象
            ret = [],     // 返回的dom对象
            root = root || document,
            element,i,name;    

        if(str.nodeType){ return [str]; }
        if(typeof str !== "string"){ return []; } //不为string返回空数组

        if(str.indexOf(",") === -1){
            if(root.querySelectorAll){
                return slice.call(root.querySelectorAll(str));  //使用内置方法
            }else{
                return getDomObj(str,root);
            }
            
        }  // 单个id的情况

        elements = str.split(reg_spl);
        ele_len = elements.length;
        for(i = 0;i<ele_len;i++){
            element = elements[i];

            if(false&&root.querySelectorAll){
                dom_obj = root.querySelectorAll(element);
            }else{
                dom_obj = slice.call(_$_getDom(element,root));
            }
            if(dom_obj){ ret = ret.concat(dom_obj); }
        }
        return ret;
    }

    function getDomObj(str, root){
    }

    function getById(id){
    }

    function getByClass(classname){
    }

    // 重点为这个方法，对于在候选集中进行过滤
    //function filter(target, factor, str){}

    // 在一个选择器表达式中 最优化的选出候选集

});