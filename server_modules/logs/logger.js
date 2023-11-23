const fs = require('fs');
const path = require('path');

const config = require('../settings/main.js');

/**
 * @author Lila BRANDON
 * @class Logger
 * @since 0.2.1
 * @description A singleton class which provides an easy way to log infos from the app into a file every two hours.
 */
class Logger {
    static _instance = null;
    /**
     * @constructor Called only once during startup, this constructor should not be called more than once.
     * @returns an instance of itself.
     */
    constructor() {
        if(!Logger._instance) { //if instance does not exist, create it
            Logger._instance = this;
            this.load();
            setInterval(() => { //execute it at a regular interval set in server.config
                this.load();
            }, config.get("logs.refreshTimeSec") * 1000);
        }
        return Logger._instance;
    }

    /**
     * @description The load function creates a new log file with the current date as name.
     */
    load(){
        if(!fs.existsSync(config.get("logs.dir"))) fs.mkdirSync(config.get("logs.dir")); //** Creates log folder if it does not exists. */
        const currentDate = new Date();
        
        //** Updates filepath to output logs to */
        const filePath = `${config.get("logs.dir")}/${currentDate.getDate()}_${currentDate.getMonth()+1}_${currentDate.getFullYear()}_at_${currentDate.getHours() < 10 ? "0" + currentDate.getHours() : currentDate.getHours()}h${currentDate.getMinutes() < 10 ? "0" + currentDate.getMinutes() : currentDate.getMinutes()}.log`;
        this._logFile = filePath;
        
        
        // Écrit dans le fichier //! Commments have to be in english
        this.info("Loading logger");
        this.removeOldest(); //** Removes old log files if amount of files exceeds the amount specified in config.json */
    }


    /**
     * @description Info function outputs a message in the current log file as a non-important information.
     * @param {*} message is the message you want to log as an info. 
     */
    info(message) {
        if(!message) throw new Error("No message to log");
        fs.appendFileSync(this._logFile, this.getTimeString() + " [INFO] " + message + "\n");
    }

    /**
     * @description Fine function outputs a message to say something works as expected
     * @param {*} message is the message you want to log as a fine information.
     */
    fine(message) {
        if(!message) throw new Error("No message to log");
        fs.appendFileSync(this._logFile, this.getTimeString() + " [FINE] " + message + "\n");
    }

    /**
     * @description Warning function outputs a message to warn you that something may be wrong but doesn't stop the app from running
     * @param {*} message is the message you want to log as a warning
     */
    warning(message) {
        if(!message) throw new Error("No message to log");
        fs.appendFileSync(this._logFile, this.getTimeString() + " [WARNING] " + message + "\n");
    }

    /**
     * @description Error function outputs a message when something is wrong and needs to be fixed quick.
     * @param {*} message is the message you want to log as an error.
     */
    error(message) {
        if(!message) throw new Error("No message to log");
        fs.appendFileSync(this._logFile, this.getTimeString() + " [ERROR] " + message + "\n");
    }


    /**
     * @description The getTimeString function is used to get the current date and time as a string.
     * @returns a string representation of the current date
     */
    getTimeString() {
        let date = new Date();
        return `[${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()} ${date.getHours() < 10 ? "0" + date.getHours() : date.getHours()}:${date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()}:${date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds()}]`;
    }


    /**
     * @description Reads log directory, if number of files exceeds the specified amount in config.json, this function will delete the oldest ones
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