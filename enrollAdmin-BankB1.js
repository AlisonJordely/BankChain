/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

//const FabricCAServices = require('fabric-ca-client');
const { Wallets, X509WalletMixin, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

//const ccpPath = path.resolve(__dirname, 'connection-banka.json');
//const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
//const ccp = JSON.parse(ccpJSON);
const ccp = yaml.load(fs.readFileSync(path.resolve(__dirname, 'conn-bankb.yaml')));

async function main() {
    try {

        // Read organizations for interacting with the CA.
        const orgInfo = ccp.organizations['71a19d224cb88c3f937711532367400d412ef217'];
        console.log(`Orgs crypto: ${orgInfo.cryptoPath}`);
        var certFile="", keyFile="";
        fs.readdirSync(`${orgInfo.cryptoPath}\\signcerts`).forEach(function(file) {
            certFile= `${orgInfo.cryptoPath}\\signcerts\\${file}`
            console.log(certFile);
        });
        fs.readdirSync(`${orgInfo.cryptoPath}\\keystore`).forEach(function(file) {
            keyFile= `${orgInfo.cryptoPath}\\keystore\\${file}`
            console.log(keyFile);
        });

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet-BankB');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        const cert = fs.readFileSync(certFile).toString();
        const key = fs.readFileSync(keyFile).toString();
//        const cert = fs.readFileSync(path.join(process.cwd(), '\\cert\\bankA.ca\\ca.bankA-cert.pem')).toString();
//        const key = fs.readFileSync(path.join(process.cwd(), '\\cert\\bankA.ca\\bankA_sk')).toString();
        console.log(`Cert: ${cert}`);
        console.log(`Key: ${key}`);
        console.log(`mspId: ${orgInfo.mspid}`);

        const identity = {
            credentials: {
                certificate: cert,
                privateKey: key,
            },
            mspId: '71a19d224cb88c3f937711532367400d412ef217MSP',
//            mspId: orgInfo.mspid,
            type: 'X.509',
        };

        // Check to see if we've already enrolled the admin user.
        const adminExists = await wallet.get('admin');
        if (adminExists) {
            console.log('An identity for the admin user "admin" already exists in the wallet');
        } else {
            // Create a new identity by interacting with the CA.
            await wallet.put("admin", identity);
            console.log('Successfully enrolled admin user "admin" and imported it into the wallet');
        }
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            identity: 'admin', 
            wallet,
            discovery: { enabled: false, asLocalhost: false }
        });
        const adminIdentity = gateway.getIdentity();
        console.log(`Connected: Id ${adminIdentity.mspId}`);
    
        const ntw = await gateway.getNetwork("bkchannel");
        console.log(`Network: ${ntw}`);

        const contract = await ntw.getContract("corprem");
        console.log(`Contract: ${contract.chaincodeId}`);

        // Submit transactions that store state to the ledger.
        const createTxResult = await contract.createTransaction("createTx")
            .submit("TX002", "David Cruz", "Acct1", "Bank1", "Addr1", "Elena Cruz", "Acct2", "Bank2", "Addr2", "USD", "200.01", "asdsadsadas", "213112dsdas", "123ddasdasd");
        console.log(new String(createTxResult));

        // Evaluate transactions that query state from the ledger.
        const queryTxResult = await contract.evaluateTransaction("queryTx", "TX002");
        console.log(JSON.parse(queryTxResult.toString()));

        await gateway.disconnect();
        console.log('Gateway disconnected');
    } catch (error) {
        console.error(`Failed to execute: ${error}`);
        process.exit(1);
    }
}

main();