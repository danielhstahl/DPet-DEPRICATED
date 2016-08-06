var express = require('express');
var app = express();
var path = require('path');
var fs=require('fs');
var open = require('open');
app.use(express.static(path.join(__dirname, 'Client'))); //  "public" off of current is root
app.listen(3500);
const spawn = require( 'child_process' ).spawn;
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
var passwordFileName='pswd.txt';
var pswd=path.join(__dirname, passwordFileName);
function hidden(query, callback) {
    var stdin = process.openStdin();
    process.stdin.on("data", function(char) {
        char = char + "";
        switch (char) {
            case "\n":
            case "\r":
            case "\u0004":
                stdin.pause();
                break;
            default:
                process.stdout.write("\033[2K\033[200D" + query + Array(rl.line.length+1).join("*"));
                break;
        }
    });
    rl.question(query, function(value) {
        rl.history = rl.history.slice(1);
        callback(value);
        rl.close();
    });
}
fs.stat(pswd, function(err, stats) { 
    if (err) { 
        hidden("Enter Password for account 0 in Geth: ", function(value) {
            fs.writeFile(pswd, value, function(err) {
                if(err) {
                    return console.log(err);
                }
                runGeth();
            });
        }); 
    } 
    else{
        runGeth();
    }
}); 
function runGeth(){
    var isOpen=false;
    const geth = spawn( 'geth', [ '--rpc', '--rpccorsdomain=*', '--testnet', '--unlock=0', '--password='+passwordFileName, '--rpcapi="db,eth,net,web3,personal"', ' --rpcport="8545"', '--rpcaddr="localhost"', '--fast']); 
    geth.stdout.on('data', data=>{
    });
    geth.stderr.on( 'data', data => { //for some reason Geth prints to stderr....
        data=""+data;
        var indexOfImported=data.indexOf("imported");
        var indexOfUnlocked=data.indexOf("Unlocked account");
        var indexOfServer=data.indexOf("Starting Server");
        if(indexOfImported>0 && !isOpen) {
            //open('http://localhost:3500');
            console.log("open");
            isOpen=true;
        }
        else if (indexOfUnlocked>0){
            console.log("Address unlocked: "+data.substring(indexOfUnlocked+"Unlocked account".length+1));
        }
        else if(indexOfServer>0){
            console.log("Geth Server Starting");
        }
        else if(!isOpen){
            console.log("Please wait...");
        }
    });
}

    
    

