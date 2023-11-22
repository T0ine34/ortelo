const fs = require('fs');
const path = require('path');
const config = require("../../config.json")

let instance = null;

/**
 * @author Lila BRANDON
 * @class Logger
 * @since 0.2.1
 * @description A singleton class which provides an easy way to log infos from the app into a file every two hours.
 */
class Logger {

    /**
     * @constructor Called only once during startup, this constructor should not be called more than once.
     * @returns an instance of itself.
     */
    constructor() {
        if(instance) return instance;
        instance = this;
        return this;
    }

    /**
     * @description The load function creates a new log file with the current date as name.
     */
    load(){
        
        if(!fs.existsSync(config.logs.dir)) fs.mkdirSync(config.logs.dir); //** Creates log folder if it does not exists. */
        this.removeOldest(); //** Removes old log files if amount of files exceeds the amount specified in config.json */
        const currentDate = new Date();

        //** Updates filepath to output logs to */
        const filePath = `${config.logs.dir}/${currentDate.getDate()}_${currentDate.getMonth()+1}_${currentDate.getFullYear()}_at_${currentDate.getHours() < 10 ? "0" + currentDate.getHours() : currentDate.getHours()}h${currentDate.getMinutes() < 10 ? "0" + currentDate.getMinutes() : currentDate.getMinutes()}.log`;
        this._logFile = filePath;
        
        
        // Écrit dans le fichier
        this.info("Loading logger");
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
        fs.readdir(config.logs.dir, (err, files) => {
            if(err) {
                this.severe("Can not remove oldests files from logs directory");
                return;
            }

            //** Checking if logs directory has more logs than max amount in config.json */
            if(files.length > config.logs.maxFiles) {
                this.info("Removing old logs from logs directory");
                const filesToRemove = files.slice(0, files.length - config.logs.maxFiles);

                filesToRemove.forEach(file => {
                    const filePath = path.join(config.logs.dir, file);

                    fs.unlink(filePath, err => {
                        if (err) {
                            this.warning(`Could not remove file ${file} : ${err.message}`);
                            return;
                        } else this.info(`Removed log file ${file}`);
                    });
                });
            } else {
                this.fine("No log files to remove");
            }

        });
    }

}

/**
 * @description Loads the logger every (time in config) seconds
 */
setInterval(() => {
    instance.load();
}, config.logs.refreshTimeSec * 1000);

/**
 * Exports the Logger so it can be used in other files
 */
module.exports = new Logger();