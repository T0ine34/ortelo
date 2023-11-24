/**
 * @fileoverview This file contains the main classes for the cookies module.
 * @since 0.2.2
 */

/**
 * @class Cookie
 * @description A class which provides an easy way to manage cookies.
 * @since 0.2.2
 * @author Antoine Buirey
 */
class Cookies{
    static _instance = null;
    /**
     * @constructor Called only once during startup, this constructor should not be called more than once.
     * @returns an instance of itself.
     */
    constructor(){
        if(!Cookies._instance) { //if instance does not exist, create it
            Cookies._instance = this;
        }
        return Cookies._instance;
    }

    /**
     * @description Get a cookie from its name.
     * @param {string} name is the name of the cookie you want to get.
     * @returns the value of the cookie if it exists, null otherwise.
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
     * @param {number} days is the number of days before the cookie expires.
     */

    set(name, value, hours){
        let expires = "";
        if(days){
            const date = new Date();
            date.setTime(date.getTime() + (hours*60*60*1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    }

    /**
     * @description Delete a cookie.
     * @param {string} name is the name of the cookie you want to delete.
     */
    delete(name){
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }

    /**
     * @description Delete all cookies.
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
     * @returns true if the cookie exists, false otherwise.
     */
    exists(name){
        return this.get(name) != null;
    }
}

let cookies = new Cookies();

export { cookies };