import React from 'react';
import ReactDOM from 'react-dom';
import injectTapEventPlugin from 'react-tap-event-plugin';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
var Web3 = require('web3');
import TextField from 'material-ui/TextField';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import RaisedButton from 'material-ui/RaisedButton';
import {Table, TableHeader, TableHeaderColumn, TableRow, TableRowColumn, TableBody} from 'material-ui/Table';
//const {Grid, Row, Col} = require('react-flexbox-grid');
import Paper from 'material-ui/Paper';
import MyRawTheme from 'theme';
var abi =[{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"trackNumberRecords","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[],"name":"kill","outputs":[],"type":"function"},{"constant":false,"inputs":[],"name":"getRevenue","outputs":[],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"},{"name":"","type":"uint256"}],"name":"pet","outputs":[{"name":"timestamp","type":"uint256"},{"name":"typeAttribute","type":"uint8"},{"name":"attributeText","type":"string"}],"type":"function"},{"constant":true,"inputs":[],"name":"collectedRevenue","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"type":"function"},{"constant":false,"inputs":[],"name":"isOwner","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":true,"inputs":[],"name":"costToAdd","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"_petid","type":"bytes32"},{"name":"_type","type":"uint8"},{"name":"_attribute","type":"string"}],"name":"addAttribute","outputs":[],"type":"function"},{"inputs":[],"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_petid","type":"bytes32"},{"indexed":false,"name":"_type","type":"PetTracker.PossibleAttributes"},{"indexed":false,"name":"_attribute","type":"string"}],"name":"attributeAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_petid","type":"bytes32"},{"indexed":false,"name":"error","type":"string"}],"name":"attributeError","type":"event"}];
var port=8545;
var url='http://localhost:'+port; 
var web3 = new Web3(new Web3.providers.HttpProvider(url));
console.log(web3.eth.accounts);
web3.eth.defaultAccount=web3.eth.accounts[0];
var contract = web3.eth.contract(abi).at('0x7205B72038Baa9948bF795899779bbdF895A5C38');

const muiTheme=getMuiTheme(MyRawTheme);
const divStyle={
    padding:50
};
const paperStyle={
    padding:20,
    margin:20
};
const CustomTable=React.createClass({
    
    render(){
        var self=this;
        return(
            <Table>
                <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
                    <TableRow>
                        {this.props.columns.map(function(val, index){
                            return <TableHeaderColumn key={index}>{val}</TableHeaderColumn>
                        })}
                    </TableRow>
                </TableHeader>
                <TableBody displayRowCheckbox={false}>
                    {this.props.data.map(function(val, index){
                        return <TableRow key={index}>
                            {self.props.columns.map(function(val1, index1){
                                var displayVal=val[val1].toString();
                                return <TableRowColumn key={index1}>{displayVal}</TableRowColumn>
                            })}
                        </TableRow>
                    })}
                </TableBody>
            </Table>
        )
    }
});
const Main=React.createClass({
    getInitialState(){
        return {
            attributeType:0,
            attributeValue:"",
            petId:0,
            currentData:null,
            historicalData:null,
            isCreator:web3.eth.defaultAccount==contract.owner()
        }
    },
    getAllRecords:function(id){
        var maxIndex=contract.trackNumberRecords(id).c[0];
        var currentResults=[];
        for(var i=0; i<maxIndex;++i){
            var val=contract.pet(id, i);
            currentResults.push({timestamp:new Date(val[0].c[0]*1000), attributeType:val[1].c[0], attributeText:val[2]});
        }
        return currentResults;
    },
    orderResults:function(){
        var results=this.getAllRecords(this.state.petId);
        var res1=alasql("SELECT MAX(timestamp) as mx, attributeType FROM $0 p GROUP BY attributeType", [results]);
        var res = alasql("SELECT t1.* FROM ? t1 INNER JOIN ? t2 ON t1.mx=t2.timestamp and t1.attributeType=t2.attributeType", [results, res1]);
        this.setState({
            currentData:res
        });
    },
    getHistoricalResults:function(){
        //console.log("got here");
        var results=this.getAllRecords(this.state.petId);
        var res=alasql("SELECT * FROM ? WHERE attributeType="+this.state.attributeType, [results]);
        //console.log(res);
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
        contract.addAttribute.sendTransaction(this.state.petId, this.state.attributeType, this.state.attributeValue, {value:contract.costToAdd(), gas:3000000}, function(err, results){
            if(err){
                console.log(err);
                console.log(results);
            }
            else{
                console.log(results);
                alert("Transaction Complete!");
                self.getHistoricalResults();
            }
        });
        contract.attributeError({_petid:this.state.petId}, function(error, result){
            if (!error){
                console.log(result);
            }
        });
        contract.attributeAdded({_petid:this.state.petId}, function(error, result){
            if (!error){
                console.log(result);
            }
        });
    },
    onId(event, func){
        if(event.keyCode===13){
            event.preventDefault();
            this[func]();
        }
        else{
            this.setState({
                petId:event.target.value
            });
        }
        
    },
    onAttributeType(event, func){
        if(event.keyCode===13){
            event.preventDefault();
            this[func]();
        }
        else{
            this.setState({
                attributeType:event.target.value
            });
        }
        
    },
    onAttributeValue(event, func){
        if(event.keyCode===13){
            event.preventDefault();
            this[func]();
        }
        else{
            this.setState({
                attributeValue:event.target.value
            });
        }
       
    },
    claimReward(){
        contract.getRevenue();
        alert("Reward Claimed");
    },
    render(){
        var self=this;
        return(
    <MuiThemeProvider muiTheme={muiTheme}>
        <div style={divStyle}>
            <Paper style={paperStyle} zDepth={2}>
                <TextField onKeyUp={function(event){return self.onId(event, "addAttribute");}} floatingLabelText="Pet ID (int)"/> 
                <TextField onKeyUp={function(event){return self.onAttributeType(event, "addAttribute");}} floatingLabelText="Type Of Attribute (int)"/>
                <TextField onKeyUp={function(event){return self.onAttributeValue(event, "addAttribute");}} floatingLabelText="Attribute Value (string)"/>
                <RaisedButton secondary={true} onMouseDown={this.addAttribute} >Submit New Result (costs Ether)</RaisedButton>
            </Paper>
        
            <Paper style={paperStyle} zDepth={2}>
                <TextField onKeyUp={function(event){return self.onId(event, "orderResults");}} floatingLabelText="Pet ID (int)"/>
                <RaisedButton  secondary={true} onMouseDown={this.orderResults}>Search Recent Records</RaisedButton>
                {this.state.currentData&&this.state.currentData[0]?<CustomTable data={this.state.currentData} columns={Object.keys(this.state.currentData[0])}/>:null}
            </Paper>
        
            <Paper style={paperStyle} zDepth={2}>
                <TextField onKeyUp={function(event){return self.onId(event, "getHistoricalResults");}} floatingLabelText="Pet ID (int)"/>
                <TextField onKeyUp={function(event){return self.onId(event, "getHistoricalResults");}} floatingLabelText="Type Of Attribute (int)"/>
                <RaisedButton secondary={true} onMouseDown={this.getHistoricalResults}>Search Historical Records</RaisedButton>
                {this.state.historicalData&&this.state.historicalData[0]?<CustomTable data={this.state.historicalData} columns={Object.keys(this.state.historicalData[0])}/>:null}
            </Paper>
        {this.state.isCreator?<RaisedButton onMouseDown={this.claimReward}>Claim Reward [Currently {contract.collectedRevenue().toString()}]</RaisedButton>:null}
    </div>
    </MuiThemeProvider>
        );
    }
}); /**/
ReactDOM.render((
  <Main/>
), document.getElementById("app"));