/*contract DistributeIncome{
  address[] public owners;
  function DistributeIncome(){

  }
  function receiveFunds(uint funds){
    this.balance+=funds;
  }
}*/
contract PetTracker{
    uint256 constant public costToAdd=100000000000000000;// .1 ether
    uint256 public collectedRevenue=0; //collectedRevenue stores collected revenue
    address public owner;
    modifier onlyOwner { if (msg.sender == owner) _ } //ensure only owner does some things
    struct Attribute{
      uint timestamp;
      uint typeAttribute;
      string attributeText;
    }
    function PetTracker(){ //owner is creator of contract
      owner=msg.sender;
    }
    mapping(bytes32=> mapping(uint=> Attribute) ) public pet; // hash of pet id to array of attributes
    mapping(bytes32=> uint) public trackNumberRecords; //number of records that a given pet has
    event attributeAdded(bytes32 _petid, uint _type, string _attribute);
    event attributeError(bytes32 _petid, string error);
    function addAttribute(bytes32 _petid, uint _type, string _attribute){
      if(msg.value<costToAdd){
        attributeError(_petid, "Too little Ether"); 
        //while this is a failsafe, the client should also check for this.  simply scrape the "costToAdd" variable
        return;
      }
     // uint256 cost=costToAdd;
      /*if(msg.sender==owner){
        cost=0;
      }  */
      //attributeError(_petid, "Got past costtoAdd"); 
      collectedRevenue+=costToAdd;
      //attributeError(_petid, "Got past collectedrevenue"); 
      uint256 excess=msg.value-costToAdd;
      if(excess>0){
        msg.sender.call.gas(200000).value(excess);
      }
      //attributeError(_petid, "Got past excess"); 
      if(trackNumberRecords[_petid]>0){ //if pet already exists in the blockchain
        pet[_petid][trackNumberRecords[_petid]]=Attribute(now, _type, _attribute);
        trackNumberRecords[_petid]+=1;
      }
      else{ //create a new record for this pet
        //attributeError(_petid, "New record"); 
        trackNumberRecords[_petid]=1;
        pet[_petid][0]=Attribute(now, _type, _attribute);
        
      }
      attributeAdded(_petid, _type, _attribute); //alert watchers that transaction went through
    }
    function kill() onlyOwner{
      selfdestruct(owner); // Makes contract inactive, returns funds
    }
    function () {
        //attributeError(0, "Something bad happened"); 
        throw; // throw reverts state to before call
    }
    function getRevenue() onlyOwner{ //scrape currently obtained revenue.  Dont do this every transaction to save on transaction costs
		  owner.call.gas(200000).value(collectedRevenue);
      collectedRevenue=0;
    }

}