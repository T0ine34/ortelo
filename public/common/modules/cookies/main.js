/**
 * @fileoverview This file contains the cookies class witch is used to manage cookies.
 * @module Cookies
 * @category Client
 * @since 0.2.2
 */

/**
 * @class Cookies
 * @description A singleton which provides an easy way to manage cookies. You are not supposed to create an instance of this class, use {@link cookies} instead.
 * @since 0.2.2
 * @author Antoine Buirey
 */
class Cookies{
    static _instance = null;
    constructor(){
        if(!Cookies._instance) { //if instance does not exist, create it
            Cookies._instance = this;
        }
        return Cookies._instance;
    }

    /**
     * @description Get a cookie from its name.
     * @param {string} name is the name of the cookie you want to get.
     * @returns {string | null} the value of the cookie if it exists, null otherwise.
     */
    get(name){
        const cookies = document.cookie.split(';');
        for(let i = 0; i < cookies.length; i++){
            const cookie = cookies[i].split('=');
            if(cookie[0].trim() == name){
                return cookie[1];
            }
        }
        return null;
    }

    /**
     * @description Set a cookie.
     * @param {string} name is the name of the cookie you want to set.
     * @param {string} value is the value of the cookie you want to set.
     * @param {number|null} hours is the number of days before the cookie expires.
     * @returns {void}
     */

    set(name, value, hours = null){
        let expires = "";
        if(hours){
            const date = new Date();
            date.setTime(date.getTime() + (hours*60*60*1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    }

    /**
     * @description Delete a cookie.
     * @param {string} name is the name of the cookie you want to delete.
     * @returns {void}
     */
    delete(name){
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }

    /**
     * @description Delete all cookies.
     * @returns {void}
     */
    deleteAll(){
        const cookies = document.cookie.split(';');
        for(let i = 0; i < cookies.length; i++){
            const cookie = cookies[i].split('=');
            this.delete(cookie[0].trim());
        }
    }

    /**
     * @description check is a cookie exists.
     * @param {string} name is the name of the cookie you want to check.
     * @returns {boolean} true if the cookie exists, false otherwise.
     */
    exists(name){
        return this.get(name) != null;
    }
}

/**
 * @description An instance of {@link Cookies}.
 * @since 0.2.2
 */
let cookies = new Cookies();

export { cookies };