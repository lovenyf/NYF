/* ģ�������
* nyf 2013.5.20
*
* ʵ�ֺ���ģ����ػ�
*
*/

(function(global, undefined){
    'use strict';
    
    var O_N = global.N,				//ԭʼ�� N ����or����
        N = global.N = {},
        doc = global.document,

		//ģ����ض���
		loaded = {},				//�����ģ��
		module = {},				//����ִ�����ɵ�ģ��

		/*
		*������Ҫʹ�õ�ԭ������
		*/

		ArrPro = Array.prototype,
		slice = ArrPro.slice,

		ObjPro = Object.prototype,
		toString = ObjPro.toString,
		hasOwn = objPro;
	
	/*
	* mix Ϊһ��������Ӹ����Ա
    * @param {Object} receiver ������
    * @param {Object} �ɶ��  supplier �ṩ��
    * @return  {Object} Ŀ�����
    * @api public
	*/
	N.mix = function(/*obj*/receiver, /*obj*/supplier){
		var args = slice.call(argument)��
			i = 1,
			key;
		while( supplier = args[i++] ){
			for( key in supplier ){
				if(hasOwn.call(supplier, key) && !( key in receiver )){
					
				}
			}
		}
	}

	N.isFunc = function(obj){
		return toString.call(obj) === "[object Function]";
	}
	
		
	N.each = function(/*array or obj*/array, /*function*/func, /*obj*/context){
	
	}

    N.defined = function(id, deps, wrap){
        
    }

	N.require = function(deps, callback){
	
	}



        
})(window);