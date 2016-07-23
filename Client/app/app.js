import React from 'react';
import ReactDOM from 'react-dom';
import injectTapEventPlugin from 'react-tap-event-plugin';
var localWeb3 = require('web3');
var CryptoJS = require("crypto-js");
import Button from 'react-bootstrap/lib/Button';
import FormControl from 'react-bootstrap/lib/FormControl';
import Grid from 'react-bootstrap/lib/Grid';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import Form from 'react-bootstrap/lib/Form';
import InputGroup from 'react-bootstrap/lib/InputGroup';
import Input from 'react-bootstrap/lib/Input';
import Table from 'react-bootstrap/lib/Table';
import Checkbox from 'react-bootstrap/lib/Checkbox';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import Jumbotron from 'react-bootstrap/lib/Jumbotron';
import Row from 'react-bootstrap/lib/Row';
import Col from 'react-bootstrap/lib/Col';
import Modal from 'react-bootstrap/lib/Modal';
//import Select from 'react-bootstrap-select';

var abi =[{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"trackNumberRecords","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"_petid","type":"bytes32"},{"name":"_type","type":"uint256"},{"name":"_attribute","type":"string"},{"name":"_isEncrypted","type":"bool"}],"name":"addAttribute","outputs":[],"type":"function"},{"constant":false,"inputs":[],"name":"kill","outputs":[],"type":"function"},{"constant":false,"inputs":[],"name":"getRevenue","outputs":[],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"},{"name":"","type":"uint256"}],"name":"pet","outputs":[{"name":"timestamp","type":"uint256"},{"name":"typeAttribute","type":"uint256"},{"name":"attributeText","type":"string"},{"name":"isEncrypted","type":"bool"}],"type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"type":"function"},{"constant":true,"inputs":[],"name":"costToAdd","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"inputs":[],"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_petid","type":"bytes32"},{"indexed":false,"name":"_type","type":"uint256"}],"name":"attributeAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_petid","type":"bytes32"},{"indexed":false,"name":"error","type":"string"}],"name":"attributeError","type":"event"}];
//var port=30303;
var port=8545;
var url='http://localhost:'+port; 

const contractAddress='0x69De4ADbb566c1c68e8dB1274229adA4A3D9f8A8';
const blockChainView='https://testnet.etherscan.io/address/';
//var web3="";
//var web3 = new Web3(new Web3.providers.HttpProvider(url));

//'0xdC2960Aed131B3D9052a11810e5c57bD08Fa79F6'
const selection=[
    "Temperament",
    "Name",
    "Owner", //this can be encrypted
    "Address" //this can be encrypted
];
const TblRow=React.createClass({
    getInitialState(){
        return {
            attributeText:this.props.attributeText,
            isEncrypted:this.props.isEncrypted
        };
    },
    decrypt(password){
        this.setState({
            attributeText:CryptoJS.AES.decrypt(this.state.attributeText, password).toString(CryptoJS.enc.Utf8),
            isEncrypted:false
        });
    },

    render(){
        var self=this;
        return(
        <Row>             
            <Col xsHidden sm={7} >{this.props.timestamp}</Col>
            <Col xs={6} sm={2}>{this.props.label}</Col>
            <Col xs={6} sm={3} >{this.state.isEncrypted?
                <Button disabled={!this.props.isEncrypted} onClick={function(){self.props.onDecrypt(self.decrypt);}}>Decrypt</Button>:
                this.state.attributeText}
            </Col>
        </Row>
        );
    }
});
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
            addedEncryption:true,
            askForPassword:false,
            myPasswordFunction:function(){},
            isCreator:this.props.web3.eth.defaultAccount==this.props.contract.owner()
        }
    },

    getAllRecords:function(id){
        var hashId=this.props.web3.sha3(id);
        var maxIndex=this.props.contract.trackNumberRecords(hashId).c[0];
        var currentResults=[];
        for(var i=0; i<maxIndex;++i){
            var val=this.props.contract.pet(hashId, i);
            var attributeText=CryptoJS.AES.decrypt(val[2], id).toString(CryptoJS.enc.Utf8);
            currentResults.push({timestamp:new Date(val[0].c[0]*1000), attributeType:val[1].c[0], attributeText:attributeText, isEncrypted:val[3]});
        }
        return currentResults;
    },
    orderResults:function(e){
		if(e){
			e.preventDefault();
		}
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
    showPasswordModal(passwordFunction){
        this.setState({
            askForPassword:true,
            myPasswordFunction:passwordFunction
        });
    },
    addAttribute:function(){
        var self=this;
        if(this.props.contract.costToAdd().greaterThan(this.props.web3.eth.getBalance(this.props.web3.eth.defaultAccount))){
            alert("Not enough Ether!");
            return;
        }
        if(this.state.addedEncryption){
            this.showPasswordModal(self.onCheckEncryption);
        }
        else{
            this.onCheckEncryption();
        }
    },
    onCheckEncryption:function(password){
        var self=this;
        var attributeValue =this.state.attributeValue;
        if(password){
            attributeValue=CryptoJS.AES.encrypt(this.state.attributeValue, password).toString();
        }
        attributeValue = CryptoJS.AES.encrypt(attributeValue, this.state.petId).toString();
        var hashedPetId=this.props.web3.sha3(this.state.petId);
        this.props.contract.addAttribute.sendTransaction(hashedPetId, this.state.attributeType, attributeValue, this.state.addedEncryption, {value:this.props.contract.costToAdd(), gas:3000000}, function(err, results){
            if(err){
                console.log(err);
                console.log(results);
            }
            else{
                console.log(results);
                alert("Transaction Complete!");
            }
        });
        this.props.contract.attributeError({_petid:hashedPetId}, function(error, result){
            if(error){
                console.log(error);
                return;
            }
            console.log(result);
        });
        this.props.contract.attributeAdded({_petid:hashedPetId}, function(error, result){
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
    hidePasswordModal(){
        this.setState({askForPassword: false});
    },
    onAttributeValue(event){
        this.setState({
            attributeValue:event.target.value
        });      
    },
    onPassword(){
        this.setState({askForPassword: false}, 
            function(){
                this.state.myPasswordFunction(this.state.password);
                this.setState({password:""});
            }
        );
    },
    onAdditionalEncryption(){
        this.setState({
            addedEncryption:!this.state.addedEncryption
        });
    },
    setPassword(e){
        this.setState({
            password:e.target.value
        });
    },
    claimReward(){
        this.props.contract.getRevenue();
        alert("Reward Claimed");
    },
    render(){
        var self=this;
        return(
            <div>
             <Jumbotron>
                <Grid>
                    <h1>DPets</h1>
                    <p>Input and access animal records: decentralized, immutable, and secure.  <a  onClick={this.showModal}>Learn More!</a></p>
                    <Row>
                        
                        <Col xs={12} sm={6} md={6}>
                            <Form inline onSubmit={this.orderResults}>
                                <FormGroup>
                                    <FormControl type="text" placeholder="Pet ID" onChange={this.onId}/>
                                </FormGroup>
                                <Button bsStyle="primary" onClick={this.orderResults}>Search</Button>
                            </Form>
                        </Col>
                        <Col xs={12} sm={6} md={6}>
                            {this.state.isCreator?
                                <Button bsStyle="success" onClick={this.claimReward}>Claim Reward [Currently { this.props.web3.fromWei(this.props.web3.eth.getBalance(contractAddress)).toString()} Ether]</Button>
                            :null}
                            
                        </Col>
                     </Row>   
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
                <p>Every pet should have a microchip which uniquely identifies itself.  A scanner can read the microchip and an ID is read.  For example, the ID may be 123.  This ID is then hashed and placed on the Ethereum blockchain.  The unhashed ID serves as a key to encrypt the name and address of the owner: hence the pet itself is needed in order to know who the owner and the address are (they are not public without knowing the ID of the pet).  This is not secure in the same sense that a human medical or banking record is secure; but as addresses are essentially public this is not a major issue.  If the medical records for the pet are not desired to be "public" then they can be encrypted using a key not associated with the microchip (eg, a password provided by the owners). 
                
                The contract that governs this is available at {contractAddress} on the blockchain.  See it <a href={blockChainView+contractAddress} target="_blank">here</a> </p>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={this.hideModal}>Close</Button>
            </Modal.Footer>
            </Modal>
            <Modal
                show={this.state.askForPassword}
                onHide={this.cancelPassword}
                dialogClassName="custom-modal"
            >
            <Modal.Body>
                <form onSubmit={function(e){e.preventDefault();self.onPassword();}}>
                    <FormGroup>
                        <ControlLabel>Password</ControlLabel>
                        <Input ref={function(input) {
                                if (input&&input.refs && input.refs.input) {
                                    input.refs.input.focus();
                                }
                            }}
                            type="password" onChange={this.setPassword}/>
                    </FormGroup>
                    <Button bsStyle="primary" onClick={function(){self.onPassword();}}>Submit</Button>
                </form>
            </Modal.Body>
            
            </Modal>

            <Grid>
                <Row className="show-grid">
                    
                   <Col xs={12} md={6}>
                        {this.state.successSearch?
                            <div size={16}>Hello {this.state.owner}, {this.state.name} is in good hands! Did something new happen in {this.state.name}'s life?  Record it on the right!  Or view current and past events below.</div>
                        :null}
                    </Col>
                    <Col xs={12} md={6}>
                        
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
                        <Checkbox disabled={!this.state.petId} checked={this.state.addedEncryption} onChange={this.onAdditionalEncryption}>Additional Encryption</Checkbox>
                        <Button bsStyle="primary" onClick={this.addAttribute}>Submit New Result (costs Ether)</Button>
                        
                    </Col>
                     
                </Row>
                <div className='whiteSpace'></div>
                <Row>
                    {this.state.successSearch?
                    <Col xs={12} md={6}>
                        <Row>
                            <Col xsHidden sm={7}>
                                <b>TimeStamp</b>
                            </Col>
                            <Col xs={6} sm={2}>
                                <b>Attribute</b>
                            </Col>
                            <Col xs={6} sm={3}>
                                <b>Value</b>
                            </Col>
                        </Row>
                        {this.state.historicalData.map(function(val, index){
                            return(
                                <TblRow key={index} timestamp={val.timestamp.toString()} attributeText={val.attributeText}  label={selection[val.attributeType]||"Unknown"} isEncrypted={val.isEncrypted} onDecrypt={self.showPasswordModal}/>
                            );
                        })}

                    </Col>
                    :null}

                </Row>
            </Grid>
            <div className='whiteSpace'></div>
            <div className='whiteSpace'></div>
            <div className='whiteSpace'></div>
            <div className='whiteSpace'></div>
            </div>
        );
    }
}); /**/
window.onload =function(){
    if(typeof web3 === 'undefined' /*&& typeof Web3 !== 'undefined'*/) {
        var web3 = new localWeb3(new localWeb3.providers.HttpProvider(url));
        // If there's a web3 library loaded, then make your own web3
        //var web3 = new Web3(web3.currentProvider);
    } /*else {
        // If there isn't then set a provider
        
    }*/
    console.log(web3.eth.accounts);
    web3.eth.defaultAccount=web3.eth.accounts[0];
    //  
    //var contractAddress='0x44549eD75e1940b2E1B5533a3c28E81E28eEA2a5';//  '0x3c8F2e129587DcD3bD418d52646966C8686a06AE';
    var contract = web3.eth.contract(abi).at(contractAddress); 
    ReactDOM.render((
        <Main web3={web3} contract={contract}/>
        ), document.getElementById("app"));
}