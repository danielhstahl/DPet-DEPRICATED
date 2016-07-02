/*contract DistributeIncome{
  address[] public owners;
  function DistributeIncome(){

  }
  function receiveFunds(uint funds){
    this.balance+=funds;
  }
}*/
contract PetTracker{
    enum PossibleAttributes{
        Name,
        Address,
        Temperament,
        Incident
    }
    uint256 constant public costToAdd=1000000000000000000;//way too high lol.  one ether
    uint256 public collectedRevenue=0; //collectedRevenue stores collected revenue
    address public owner;
    modifier onlyOwner { if (msg.sender == owner) _ } //ensure only owner does some things
    struct Attribute{
      uint timestamp;
      PossibleAttributes typeAttribute;
      string attributeText;
    }
    function PetTracker(){ //owner is creator of contract
      owner=msg.sender;
    }
    function isOwner() returns(bool){
      return msg.sender==owner;
    }
    mapping(bytes32=> mapping(uint=> Attribute) ) public pet; // hash of pet id to array of attributes
    mapping(bytes32=> uint) public trackNumberRecords; //number of records that a given pet has
    event attributeAdded(bytes32 _petid, PossibleAttributes _type, string _attribute);
    event attributeError(bytes32 _petid, string error);
    function addAttribute(bytes32 _petid, PossibleAttributes _type, string _attribute){
      if(msg.value<costToAdd){
        attributeError(_petid, "Too little Ether"); 
        //while this is a failsafe, the client should also check for this.  simply scrape the "costToAdd" variable
        return;
      }
      if(owner!=msg.sender){
        collectedRevenue+=costToAdd;
        uint excess=msg.value-costToAdd;
        if(excess>0){
          msg.sender.send(excess);
        }
      }
      if(trackNumberRecords[_petid]>0){ //if pet already exists in the blockchain
        pet[_petid][trackNumberRecords[_petid]]=Attribute(now, _type, _attribute);
        trackNumberRecords[_petid]+=1;
      }
      else{ //create a new record for this pet
        trackNumberRecords[_petid]=1;
        pet[_petid][0]=Attribute(now, _type, _attribute);
      }
      attributeAdded(_petid, _type, _attribute); //alert watchers that transaction went through
    }
    function kill() {
      if(msg.sender == owner) { // Only let the contract creator do this
          selfdestruct(owner); // Makes contract inactive, returns funds
      }
    }
    function () {
        throw; // throw reverts state to before call
    }
    function getRevenue() onlyOwner{ //scrape currently obtained revenue.  Dont do this every transaction to save on transaction costs
      owner.send(collectedRevenue);
      collectedRevenue=0;
    }

}