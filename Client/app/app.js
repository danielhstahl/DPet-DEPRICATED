import React from 'react';
import ReactDOM from 'react-dom';
import injectTapEventPlugin from 'react-tap-event-plugin';
var Web3 = require('web3');
var CryptoJS = require("crypto-js");
import Button from 'react-bootstrap/lib/Button';
import FormControl from 'react-bootstrap/lib/FormControl';
import Grid from 'react-bootstrap/lib/Grid';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import InputGroup from 'react-bootstrap/lib/InputGroup';
import Table from 'react-bootstrap/lib/Table';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import Jumbotron from 'react-bootstrap/lib/Jumbotron';
import Row from 'react-bootstrap/lib/Row';
import Col from 'react-bootstrap/lib/Col';
import Modal from 'react-bootstrap/lib/Modal';
//import Select from 'react-bootstrap-select';

var abi =[{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"trackNumberRecords","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[],"name":"kill","outputs":[],"type":"function"},{"constant":false,"inputs":[],"name":"getRevenue","outputs":[],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"},{"name":"","type":"uint256"}],"name":"pet","outputs":[{"name":"timestamp","type":"uint256"},{"name":"typeAttribute","type":"uint256"},{"name":"attributeText","type":"string"}],"type":"function"},{"constant":true,"inputs":[],"name":"collectedRevenue","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"type":"function"},{"constant":true,"inputs":[],"name":"costToAdd","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"_petid","type":"bytes32"},{"name":"_type","type":"uint256"},{"name":"_attribute","type":"string"}],"name":"addAttribute","outputs":[],"type":"function"},{"inputs":[],"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_petid","type":"bytes32"},{"indexed":false,"name":"_type","type":"uint256"},{"indexed":false,"name":"_attribute","type":"string"}],"name":"attributeAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_petid","type":"bytes32"},{"indexed":false,"name":"error","type":"string"}],"name":"attributeError","type":"event"}];
var port=8545;
var url='http://localhost:'+port; 
var web3 = new Web3(new Web3.providers.HttpProvider(url));
console.log(web3.eth.accounts);
const selection=[
    "Temperament",
    "Name",
    "Owner", //this will be encrypted
    "Address" //this will be encrypted
];

web3.eth.defaultAccount=web3.eth.accounts[0];
var contract = web3.eth.contract(abi).at('0x3c8F2e129587DcD3bD418d52646966C8686a06AE'); //'0xdC2960Aed131B3D9052a11810e5c57bD08Fa79F6'
const Main=React.createClass({
    getInitialState(){
        return {
            attributeType:0,
            attributeValue:"",
            petId:0,
            name:"",
            owner:"",
            successSearch:false,
            currentData:null,
            historicalData:null,
            isCreator:web3.eth.defaultAccount==contract.owner()
        }
    },
    getAllRecords:function(id){
        var hashId=web3.sha3(id);
        var maxIndex=contract.trackNumberRecords(hashId).c[0];
        var currentResults=[];
        for(var i=0; i<maxIndex;++i){
            var val=contract.pet(hashId, i);
            var attributeText=CryptoJS.AES.decrypt(val[2], id).toString(CryptoJS.enc.Utf8);
            currentResults.push({timestamp:new Date(val[0].c[0]*1000), attributeType:val[1].c[0], attributeText:attributeText});
        }
        return currentResults;
    },
    orderResults:function(){
        var results=this.getAllRecords(this.state.petId);
        console.log(results);
        if(results.length>0){
            var res1=alasql("SELECT MAX(timestamp) as mx, attributeType FROM $0 p GROUP BY attributeType", [results]);
            var res = alasql("SELECT t1.* FROM ? t1 INNER JOIN ? t2 ON t1.mx=t2.timestamp and t1.attributeType=t2.attributeType", [results, res1]);
            var name = alasql("SELECT attributeText FROM ? WHERE attributeType=1", [res]); //name
            var owner = alasql("SELECT attributeText FROM ? WHERE attributeType=2", [res]); //owner
            this.getHistoricalResults(results);
            this.setState({
                currentData:res,
                name:name.length>0?name[0].attributeText:"",
                owner:owner.length>0?owner[0].attributeText:"",
                successSearch:results.length>0
            });
        }
        else{
            this.setState({
                successSearch:false
            });
        }
        
    },
    getHistoricalResults:function(results){
        var res=results;
        if(!res){
            res=this.getAllRecords(this.state.petId);
        }
        this.setState({
            historicalData:res
        });
    },
    addAttribute:function(){
        var self=this;
        if(contract.costToAdd().greaterThan(web3.eth.getBalance(web3.eth.defaultAccount))){
            alert("Not enough Ether!");
            return;
        }
        var attributeValue = CryptoJS.AES.encrypt(this.state.attributeValue, this.state.petId).toString();
        var hashedPetId=web3.sha3(this.state.petId);
        contract.addAttribute.sendTransaction(hashedPetId, this.state.attributeType, attributeValue, {value:contract.costToAdd(), gas:3000000}, function(err, results){
            if(err){
                console.log(err);
                console.log(results);
            }
            else{
                console.log(results);
                alert("Transaction Complete!");
            }
        });
        contract.attributeError(/*{_petid:hashedPetId},*/ function(error, result){
            if(error){
                console.log(error);
                return;
            }
            console.log(result);
        });
        contract.attributeAdded(/*{_petid:hashedPetId},*/ function(error, result){
            if(error){
                console.log(error);
                return;
            }
            console.log(result);
            self.orderResults();
        });
    },
    onId(event){
        this.setState({
            petId:event.target.value
        });
    },
    onAttributeType(event){
        this.setState({
            attributeType:event.target.value
        });
    },
    showModal() {
        this.setState({show: true});
    },
    hideModal() {
        this.setState({show: false});
    },
    onAttributeValue(event){
        this.setState({
            attributeValue:event.target.value
        });      
    },
    claimReward(){
        contract.getRevenue();
        alert("Reward Claimed");
    },
    render(){
        var self=this;
        return(
            <div>
             <Jumbotron>
                <Grid>
                    <h1>DPets</h1>
                    <p>Input and access animal records: decentralized, immutable, and secure</p>
                    <Button bsStyle="primary" onClick={this.showModal}>Learn more</Button>
                    {this.state.isCreator?
                        <Button bsStyle="success" onClick={this.claimReward}>Claim Reward [Currently {contract.collectedRevenue().toString()}]</Button>
                    :null}
                </Grid>
            </Jumbotron>
            <Modal
                show={this.state.show}
                onHide={this.hideModal}
                dialogClassName="custom-modal"
            >
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-lg">About</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <h4>How it works</h4>
                <p>Every pet should have a microchip which uniquely identifies itself.  A scanner can read the microchip and an ID is read.  For example, the ID may be 123.  This ID is then hashed and placed on the Ethereum blockchain.  The unhashed ID serves as a key to encrypt the name and address of the owner: hence the pet itself is needed in order to know who the owner and the address are (they are not public without knowing the ID of the pet).  This is not secure in the same sense that a human medical or banking record is secure; but as addresses are essentially public this is not a major issue.  If the medical records for the pet are not desired to be "public" then they can be encrypted using a key not associated with the microchip (eg, a password provided by the owners).  </p>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={this.hideModal}>Close</Button>
            </Modal.Footer>
            </Modal>
            <Grid>
                <Row className="show-grid">
                    <Col xs={12} md={2}>
                        
                            <FormGroup>
                                <FormControl type="text" placeholder="Pet ID" onChange={this.onId}/>
                            </FormGroup>
                            <Button bsStyle="primary" onClick={this.orderResults}>Search</Button>


                    </Col>
                    <Col xs={12} md={6}>
                        {this.state.successSearch?
                        <Table striped bordered condensed hover>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Owner</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{this.state.name}</td>
                                    <td>{this.state.owner}</td>
                                </tr>
                            </tbody>
                        </Table>
                        :null}
                    </Col>
                    <Col xs={12} md={4}>
                        
                        <FormGroup>
                            <ControlLabel>Type</ControlLabel>
                            <FormControl componentClass="select" placeholder="select" disabled={!this.state.petId} onChange={this.onAttributeType}>
                                {selection.map(function(val, index){
                                    return(<option key={index} value={index}>{val}</option>)
                                })}
                            </FormControl>
                        </FormGroup>
                        
                        <FormGroup>
                            <ControlLabel>Value</ControlLabel>
                            <FormControl type="text" disabled={!this.state.petId}  onChange={this.onAttributeValue}/>
                        </FormGroup>
                        <Button bsStyle="primary" onClick={this.addAttribute}>Submit New Result (costs Ether)</Button>
                        
                    </Col>
                </Row>
                <div className='whiteSpace'></div>
                <Row>
                    {this.state.successSearch?
                    <Col xs={12}>
                    <Table striped bordered condensed hover>
                        <thead>
                            <tr>
                                <th>TimeStamp</th>
                                <th>Attribute</th>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {this.state.historicalData.map(function(val, index){
                                return(
                                <tr key={index}>
                                    
                                    <td >{val.timestamp.toString()}</td>
                                    <td >{selection[val.attributeType]||"Unknown"}</td>
                                    <td >{val.attributeText}</td>
                                </tr>)
                            })}
                        </tbody>
                    </Table>
                    </Col>
                    :null}

                </Row>
            </Grid>
            </div>
        );
    }
}); /**/
ReactDOM.render((
  <Main/>
), document.getElementById("app"));