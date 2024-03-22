const { spawnSync } = require('child_process');
const { obfuscation } = require("./obfusc");

const python = process.platform === 'win32' ? 'python' : 'python3';
const node = 'node';
/**
 * Run a process from the command line, printing stdout and stderr to the console.
 * Waits for the process to exit before returning.
 * @param {string} cmd The command to run.
 * @param {string[]} args The arguments to pass to the command.
 * @returns {number} The exit code of the process.
 */
function runProcess(cmd, args) {
    console.log(`Running ${cmd} ${args.join(' ')}`);
    const child = spawnSync(cmd, args, { stdio: 'inherit' });
    return child.status;
}

const STEPS = { //define steps here
    updateDatabase : function(){
        return runProcess(python, ['building/database.py']);
    },
    obfuscateCode : function() {
        if (process.env.OrteloDEPLOY) {
            return runProcess(node, ['public'])
        } else {
            return 0
        }
    },
    startServer : function(){
        return runProcess('node', ['server.js']);
    }
}

// set required to true if the step is required to successfully launch the app
// if required is false, the step will be skipped if it fails
// if required is true, the app will exit if the step fails
STEPS.updateDatabase.required = false;
STEPS.obfuscateCode.required = false;
STEPS.startServer.required = true;


function main(){
    //step is all functions in STEPS
    let steps = Object.values(STEPS);
    for(let step of steps){
        let exitCode = step();
        if(step.required && exitCode != 0){
            console.log(`Error running step ${step.name}`);
            break;
        }
    }
}

main();