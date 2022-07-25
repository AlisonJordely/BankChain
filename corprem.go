package main

import (
	"fmt"
	"encoding/json"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

// SimpleChaincode example simple Chaincode implementation
type SimpleChaincode struct {
}

type FinTransaction struct {
	txid string
	Sname string
	Saccount string
	Sbank string
	Saddr string
	Rname string
	Raccount string
	Rbank string
	Raddress string
	curr string
	amt string
	InvHash string
	BOEHash string
	DocHash	 string
}

func (t *SimpleChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {
	fmt.Println("Init")
	// Initialize data
	return shim.Success(nil)
}

// Chaincode interaction entry
func (t *SimpleChaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	fmt.Println("Invoke")
	functionName, args := stub.GetFunctionAndParameters()
	if functionName == "createTx" {
		// insert
		return t.createTx(stub, args)
	} else if functionName == "queryTx" {
		// query
		return t.queryTx(stub, args)
	}

	return shim.Error("Invalid invoke function name. Expecting \"createTx\" \"queryTx\"")
}

// The Insert method implements the data storage function and stores the key-value on the chain
func (t *SimpleChaincode) createTx(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	if len(args) != 14 {
		return shim.Error("Incorrect number of arguments. Expecting 14")
	}
	fmt.Println("args=", args)
	txid := args[0]
    transaction := FinTransaction {
		txid : args[0],
		Sname : args[1],
		Saccount : args[2],
		Sbank : args[3],
		Saddr : args[4],
		Rname : args[5],
		Raccount : args[6],
		Rbank : args[7],
		Raddress : args[8],
		curr : args[9],
		amt : args[10],
		InvHash : args[11],
		BOEHash : args[12],
		DocHash	 : args[13],
	}
	bTx, _ := json.Marshal(transaction)
	// Write the key and vals back to the ledger
//	err := stub.PutState(txid, []byte(transaction))
	err := stub.PutState(txid, bTx)
	if err != nil {
		return shim.Error(err.Error())
	}
	stub.SetEvent("txCreated", bTx);
	fmt.Println("============= END : Create Transaction ===========")
	return shim.Success(nil)
}

// The Query method implements the data query function by invoking the API to query the value of the key
func (t *SimpleChaincode) queryTx(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting name of the person to query")
	}

	key := args[0]

	// Get the value of key
	val, err := stub.GetState(key)
	if err != nil {
		jsonResp := "{\"Error\":\"Failed to get key for " + key + "\"}"
		return shim.Error(jsonResp)
	}

	if val == nil {
		jsonResp := "{\"Error\":\"Nil val for " + key + "\"}"
		return shim.Error(jsonResp)
	}

	jsonResp := "{\"key\":\"" + key + "\",\"val\":\"" + string(val) + "\"}"
	fmt.Printf("Query Response:%s\n", jsonResp)
	return shim.Success(val)
}

func main() {
	err := shim.Start(new(SimpleChaincode))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode: %s", err)
	}
}
