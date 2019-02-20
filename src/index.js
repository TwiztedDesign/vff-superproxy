import {uuid, findKey, deepExtend, deepCompare} from './helpers.js';

const
    BYPASS_PREFIX   = '__bypass__',
    PARENT_ID       = '__parent_id__',
    PARENT_KEY      = '__parent_key__',
    PROXY_ID        = '__proxy__',
    IS_PROXY        = '__isProxy__',
    SELF            = '__self__';


const isInternalName = function(name){
    return name.startsWith('__') && name.endsWith('__');
};
const isInternalProperty = function(prop){
    return isInternalName(prop) && prop !== '__proxy__';
};
const cleanInternal = function(object){
    Object.keys(object).forEach((key) => {
        if(isInternalProperty(key)){
            delete object[key];
        } if(typeof object[key] === 'object'){
            cleanInternal(object[key]);
        }
    });
};
const noBypass = (key) => {
    return typeof key === 'string'? key.replace(BYPASS_PREFIX ,'') : '';
};

export default class SuperProxy {
    constructor(data, traps) {
        this._proxies = {};

        this._parents = new WeakMap();
        this._parentIDs = {};

        traps = traps || {};
        this._proxy = new Proxy(this._copy(data), this._traps(traps));

        let self = this;

        return new Proxy(this, {
            get : function(target, prop){

                if(prop in target){
                    return target[prop];
                }
                let key = findKey(self._proxy, noBypass(prop));
                prop = key || prop;
                return self._proxy[prop];
            },
            set : function(target, prop, value){
                if(prop in target){
                    throw  new Error("Override Error: " + prop + " is an internal vff property and can't be overridden");
                    // return target[prop] = value;
                } else {
                    target._proxy[prop] = value;
                }
                return true;
            }
        });

    }
    /************************* PUBLIC *****************************/
    findKey(key){
        return findKey(this._proxy, key);
    }
    update(data){
        let toUpdate = this._copy(data, BYPASS_PREFIX);
        deepExtend(this._proxy, toUpdate);
    }
    equals(data){
        return deepCompare(this._proxy, data);
    }

    /************************* PRIVATE *****************************/

    _copy(o, prefix) {
        prefix = prefix || '';
        let output, v, key;
        output = Array.isArray(o) ? [] : {};
        for (key in o) {
            v = o[key];
            if (Array.isArray(output)) {
                output[key] = (typeof v === "object") ? this._copy(v, prefix) : v;
            } else if(!isInternalName(key)){
                output[prefix + key] = (typeof v === "object") ? this._copy(v, prefix) : v;
            }
        }
        return output;
    }

    _set(target, key, value){
        target[BYPASS_PREFIX + key] = value;
    }

    _getPath(obj, key){
        let path = key? [key] : [];
        let tmp = obj;
        while(tmp[PARENT_ID]){
            path.unshift(tmp[PARENT_KEY]);
            tmp = this._parentIDs[tmp[PARENT_ID]];
        }
        return path;
    }

    _traps(trapFuncs) {
        let self = this;

        let traps = {
            set: (target, key, value) => {
                let bypass = key.startsWith(BYPASS_PREFIX);
                // if (bypass && !target[IS_PROXY]) {
                if (bypass) {
                    key = key.substr(BYPASS_PREFIX.length);
                }
                target[key] = value;
                // if (!bypass && !target[IS_PROXY] && typeof value !== 'object') {
                if (!bypass) {
                    if (trapFuncs.set) {
                        //set with parent object, path array, value
                        let path = self._getPath(target, key);
                        // cleanInternal(target);
                        trapFuncs.set(target, path, value);
                    }
                }
                return true;
            },
            get: (target, key) => {
                if (key === IS_PROXY) {
                    return true;
                }
                if (key === SELF) {
                    cleanInternal(target);
                    return target;
                }
                if (key.startsWith && key.startsWith(BYPASS_PREFIX)) {
                    key = key.substr(BYPASS_PREFIX.length);
                }

                // if (typeof target[key] === 'object' && target[key] !== null && !target[key][IS_PROXY] && !isInternalProperty(key)) {
                if (typeof target[key] === 'object' && target[key] !== null && !isInternalProperty(key)) {
                    if (target[key][PROXY_ID]) {
                        return self._proxies[target[key][PROXY_ID]];
                    } else {
                        let proxy = new Proxy(target[key], traps);

                        let parentID;
                        if(!self._parents.has(target)){
                            parentID = uuid();
                            self._parents.set(target, parentID);
                            self._parentIDs[parentID] = target;
                        }
                        parentID = parentID || self._parents.get(target);

                        self._set(proxy, PARENT_KEY, key);
                        self._set(proxy, PARENT_ID, parentID);
                        let proxyID = uuid();
                        self._proxies[proxyID] = proxy;
                        target[key][PROXY_ID] = proxyID;
                        return proxy;
                    }
                }
                else {
                    return target[key];
                }
            }
        };
        return traps;
    }
}