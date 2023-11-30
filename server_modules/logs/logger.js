const fs = require('fs');
const path = require('path');

const config = require('../settings/main.js');

/**
 * @module Logger
 * @category Server
 * @description This module contains the Logger class.
 * @since 0.2.1
 * @author Lila BRANDON, Antoine Buirey
 */

/**
 * @description Replace all \n by \n + indent
 * @param {string} str is the string you want to indent
 * @param {number} indent is the string you want to use to indent
 * @returns the indented string
 * @since 0.2.2
 * @private
 * @author Antoine Buirey
 */
function indent(str, indent){
    return str.replace(/\n/g, "\n"+"\t".repeat(indent));
}


/**
 * @author Lila BRANDON
 * @class Logger
 * @since 0.2.1
 * @description A singleton class which provides an easy way to log infos from the app into a file every two hours.
 */
class Logger {
    static _instance = null;
    constructor() {
        if(!Logger._instance) { //if instance does not exist, create it
            Logger._instance = this;
            this.use_debug = config.get("logs.useDebug");
            this.load();
            setInterval(() => { //execute it at a regular interval set in server.config
                this.load();
            }, config.get("logs.refreshTimeSec") * 1000);
        }
        return Logger._instance;
    }

    /**
     * @description The load function creates a new log file with the current date as name.
     * @function
     */
    load(){
        if(!fs.existsSync(config.get("logs.dir"))) fs.mkdirSync(config.get("logs.dir")); //** Creates log folder if it does not exists. */
        const currentDate = new Date();
        
        //** Updates filepath to output logs to */
        const filePath = `${config.get("logs.dir")}/${currentDate.getDate()}_${currentDate.getMonth()+1}_${currentDate.getFullYear()}_at_${currentDate.getHours() < 10 ? "0" + currentDate.getHours() : currentDate.getHours()}h${currentDate.getMinutes() < 10 ? "0" + currentDate.getMinutes() : currentDate.getMinutes()}.log`;
        if(this._logFile && this._logFile != filePath){
            this.info("log file changed to " + filePath + "\n nothing will be added in this file anymore");
        }
        this._logFile = filePath;
        
        
        // write the first line of the log file
        this.info("new log file created");
        this.removeOldest(); //** Removes old log files if amount of files exceeds the amount specified in config.json */
    }


    /**
     * @description Info function outputs a message in the current log file as a non-important information.
     * @param {string} message is the message you want to log as an info. 
     * @function
     */
    info(message) {
        if(!message) throw new Error("No message to log");
        fs.appendFileSync(this._logFile, this.getTimeString() + " [INFO] " + indent(message,8) + "\n");
    }

    /**
     * @description Fine function outputs a message to say something works as expected
     * @param {string} message is the message you want to log as a fine information.
     * @function
     */
    fine(message) {
        if(!message) throw new Error("No message to log");
        fs.appendFileSync(this._logFile, this.getTimeString() + " [FINE] " + indent(message,8) + "\n");
    }

    /**
     * @description Warning function outputs a message to warn you that something may be wrong but doesn't stop the app from running
     * @param {string} message is the message you want to log as a warning
     * @function
     */
    warning(message) {
        if(!message) throw new Error("No message to log");
        fs.appendFileSync(this._logFile, this.getTimeString() + " [WARNING] " + indent(message,8) + "\n");
    }

    /**
     * @description Error function outputs a message when something is wrong and needs to be fixed quick.
     * @param {string} message is the message you want to log as an error.
     * @function
     */
    error(message) {
        if(!message) throw new Error("No message to log");
        fs.appendFileSync(this._logFile, this.getTimeString() + " [ERROR] " + indent(message,8) + "\n");
    }

    /**
     * @description Debug function outputs a message to help you debug your app. Only works if use_debug is set to true in config file.
     * @param {string} message is the message you want to log as a debug.
     * @function
     */
    debug(message) {
        if(!this.use_debug) return;
        if(!message) throw new Error("No message to log");
        fs.appendFileSync(this._logFile, this.getTimeString() + " [DEBUG] " + indent(message,8) + "\n");
    }


    /**
     * @description The getTimeString function is used to get the current date and time as a string.
     * @returns a string representation of the current date
     * @function
     */
    getTimeString() {
        let date = new Date();
        return `[${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()} ${date.getHours() < 10 ? "0" + date.getHours() : date.getHours()}:${date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()}:${date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds()}]`;
    }


    /**
     * @description Reads log directory, if number of files exceeds the specified amount in config.json, this function will delete the oldest ones
     * @function
     */
    removeOldest() {
        fs.readdir(config.get("logs.dir"), (err, files) => {
            if(err) {
                this.error("Can not remove oldests files from logs directory");
                return;
            }

            //** Checking if logs directory has more logs than max amount in config.json */
            if(files.length > config.get("logs.maxFiles")) {
                this.info("Removing old logs from logs directory");
                const filesToRemove = files.slice(0, files.length - config.get("logs.maxFiles"));

                filesToRemove.forEach(file => {
                    const filePath = path.join(config.get("logs.dir"), file);

                    fs.unlink(filePath, err => {
                        if (err) {
                            this.warning(`Could not remove file ${file} : ${err.message}`);
                            return;
                        } else this.fine(`Removed log file ${file}`);
                    });
                });
            } else {
                this.fine("No log files to remove");
            }

        });
    }

}


/**
 * Exports the Logger so it can be used in other files
 */
module.exports = new Logger();