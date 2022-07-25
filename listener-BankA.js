var express = require("express");
var app = express();
var bodyParser = require("body-parser");
const ipfsAPI = require('ipfs-api');
//const ipfs = ipfsAPI('127.0.0.1', '5001', {protocol: 'http'});
const ipfs = ipfsAPI('ipfs.infura.io', '5001', {protocol: 'https'});
const { Wallets, Gateway } = require('fabric-network');
const pg = require('pg');
const client = new pg.Client({
    host: "110.238.69.113",
    port: 5432,
    user: "root",
    password: "Admin!123#%",
    database: "banka",
    ssl: false,
});
client.connect();

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const ccp = yaml.load(fs.readFileSync(path.resolve(__dirname, 'conn-banka.yaml')));

Transactionlister();	
	
async function Transactionlister (){
	try {
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet-BankA');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);
		const userExists = await wallet.get('admin');
        if (!userExists) {
            console.log('An identity for the user "admin" does not exist in the wallet');
            console.log('Run the enrollAdmin-BankA.js application before retrying');
            return;
        }
        const gateway = new Gateway();
        await gateway.connect(ccp, { 
            wallet, 
            identity: 'admin', 
            discovery: { enabled: false, asLocalhost: false } 
        });
        console.log("Gateway Connected");	
        const network = await gateway.getNetwork('bkchannel')
        const contract = network.getContract('corprem');
        /**
         * @param {String} listenerName the name of the event listener
         * @param {String} eventName the name of the event being listened to
         * @param {Function} callback the callback function with signature (error, event, blockNumber, transactionId, status)
         * @param {module:fabric-network.Network~EventListenerOptions} options
        **/
        await contract.addContractListener('contract-listener', 'txCreated', (err, event, blockNumber, transactionId, status) => {
            if (err) {
                console.error(err);
                return;
            }
        	console.log(`Block Number: ${blockNumber} Transaction ID: ${transactionId} Status: ${status}`);
        	var trans=JSON.parse(event.payload.toString());
	        console.log(trans);
	    	if(trans.Rbank == 'Bank A')	{
	    		client.query('SELECT balance from customers where account = $1', [trans.Raccount], (error, results)=> {
	                if (error) {
                        throw error
                    }	
	                if(results) {	  
	                    var oldbal = results.rows[0].balance;
	                    console.log("old",oldbal);
	                    console.log(trans.amt);	  
                        var newbal = Number(oldbal) + Number(trans.amt);  
                        console.log(newbal);
                        client.query('UPDATE customers set balance = $1 where account = $2', [newbal, trans.Raccount], (error, results) => {
	                	console.log(error);
	                    console.log(results);	
	                	    if (error) {
                                throw error
                            }	
	                	    console.log(trans);
		                    client.query('INSERT INTO transactions(transaction_id,saddress, saccount,sname, sbank, raddress, raccount, rname, rbank, amount, currency, invhash, boehash, dochash, transtype) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)', [trans.txid,trans.Saddr, trans.Saccount, trans.Sname, trans.Sbank, trans.Raddress, trans.Raccount, trans.Rname, trans.Rbank,trans.amt,trans.curr,trans.InvHash,trans.BOEHash,trans.DocHash, 'Incoming'], (error, results) => {
	                    	    if (error) {
                                    throw error
                                }
	                		    console.log(results);
		                        iread(trans.InvHash,trans.BOEHash,trans.DocHash);
		                    })
	                    })
	                }
	            })		
            }
        })
    } catch (error) {
        console.error(`Failed to LISTEN: ${error}`);
        process.exit(1);
    }
}
 
async function iread (invhash,boehash,dochash) {
    try {
        const invfile = await ipfs.get(invhash)
        const sep='/';
        invfile.forEach((file) => {
            var url = __dirname + sep + invhash;	
            var writeStream = fs.createWriteStream(url);
            writeStream.write(file.content.toString('utf8'));
            writeStream.end();
        })
        const boefile = await ipfs.get(boehash)
        boefile.forEach((file) => {
            var url = __dirname + sep + boehash;	
            var writeStream = fs.createWriteStream(url);
            writeStream.write(file.content.toString('utf8'));
            writeStream.end();
        })
        const docfile = await ipfs.get(dochash)
        docfile.forEach((file) => {
            var url = __dirname + sep + dochash;	
            var writeStream = fs.createWriteStream(url);
            writeStream.write(file.content.toString('utf8'));
            writeStream.end();
        })
    }catch (error) {
        console.error(`Failed to write: ${error}`);
    }
}	