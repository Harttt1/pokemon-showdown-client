/**
 * Battle choices
 *
 * PS will send requests "what do you do this turn?", and you send back
 * choices "I switch Pikachu for Caterpie, and Squirtle uses Water Gun"
 *
 * This file contains classes for handling requests and choices.
 *
 * Dependencies: battle-dex
 *
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */var


























































































BattleChoiceBuilder=function(){



















function BattleChoiceBuilder(request){this.request=void 0;this.choices=[];this.current={choiceType:'move',move:0,targetLoc:0,mega:false,ultra:false,z:false,max:false};this.alreadySwitchingIn=[];this.alreadyMega=false;this.alreadyMax=false;this.alreadyZ=false;
this.request=request;
this.fillPasses();
}var _proto=BattleChoiceBuilder.prototype;_proto.

toString=function toString(){
var choices=this.choices;
if(this.current.move)choices=choices.concat(this.stringChoice(this.current));
return choices.join(', ').replace(/, team /g,', ');
};_proto.

isDone=function isDone(){
return this.choices.length>=this.requestLength();
};_proto.
isEmpty=function isEmpty(){for(var _i=0,_this$choices=
this.choices;_i<_this$choices.length;_i++){var choice=_this$choices[_i];
if(choice!=='pass')return false;
}
if(this.current.move)return false;
return true;
};_proto.


index=function index(){
return this.choices.length;
};_proto.

requestLength=function requestLength(){
var request=this.request;
switch(request.requestType){
case'move':
return request.active.length;
case'switch':
return request.forceSwitch.length;
case'team':
if(request.maxTeamSize)return request.maxTeamSize;
return 1;
case'wait':
return 0;}

};_proto.
currentMoveRequest=function currentMoveRequest(){
if(this.request.requestType!=='move')return null;
return this.request.active[this.index()];
};_proto.

addChoice=function addChoice(choiceString){
var choice;
try{
choice=this.parseChoice(choiceString);
}catch(err){
return err.message;
}
if(!choice){
return"You do not need to manually choose to pass; the client handles it for you automatically";
}
if(choice.choiceType==='move'){
if(!choice.targetLoc&&this.requestLength()>1){
var choosableTargets=['normal','any','adjacentAlly','adjacentAllyOrSelf','adjacentFoe'];
if(choosableTargets.includes(this.getChosenMove(choice,this.index()).target)){
this.current.move=choice.move;
this.current.mega=choice.mega;
this.current.ultra=choice.ultra;
this.current.z=choice.z;
this.current.max=choice.max;
return null;
}
}
if(choice.mega)this.alreadyMega=true;
if(choice.z)this.alreadyZ=true;
if(choice.max)this.alreadyMax=true;
this.current.move=0;
this.current.mega=false;
this.current.ultra=false;
this.current.z=false;
this.current.max=false;
}else if(choice.choiceType==='switch'||choice.choiceType==='team'){
if(this.alreadySwitchingIn.includes(choice.targetPokemon)){
if(choice.choiceType==='switch'){
return"You've already chosen to switch that Pokémon in";
}

for(var i=0;i<this.alreadySwitchingIn.length;i++){
if(this.alreadySwitchingIn[i]===choice.targetPokemon){
this.alreadySwitchingIn.splice(i,1);
this.choices.splice(i,1);
return null;
}
}
return"Unexpected bug, please report this";
}
this.alreadySwitchingIn.push(choice.targetPokemon);
}else if(choice.choiceType==='shift'){
if(this.index()===1){
return"Only Pokémon not already in the center can shift to the center";
}
}
this.choices.push(this.stringChoice(choice));
this.fillPasses();
return null;
};_proto.






fillPasses=function fillPasses(){
var request=this.request;
switch(request.requestType){
case'move':
while(this.choices.length<request.active.length&&!request.active[this.choices.length]){
this.choices.push('pass');
}
break;
case'switch':
while(this.choices.length<request.forceSwitch.length&&!request.forceSwitch[this.choices.length]){
this.choices.push('pass');
}}

};_proto.

getChosenMove=function getChosenMove(choice,pokemonIndex){
var request=this.request;
var activePokemon=request.active[pokemonIndex];
var moveIndex=choice.move-1;
if(choice.z){
return activePokemon.zMoves[moveIndex];
}
if(choice.max||activePokemon.maxMoves&&!activePokemon.canDynamax){
return activePokemon.maxMoves[moveIndex];
}
return activePokemon.moves[moveIndex];
};_proto.




parseChoice=function parseChoice(choice){
var request=this.request;
if(request.requestType==='wait')throw new Error("It's not your turn to choose anything");

var index=this.choices.length;

if(choice==='shift')return{choiceType:'shift'};

if(choice.startsWith('move ')){
if(request.requestType!=='move'){
throw new Error("You must switch in a Pok\xE9mon, not move.");
}
var moveRequest=request.active[index];
choice=choice.slice(5);
var current={
choiceType:'move',
move:0,
targetLoc:0,
mega:false,
ultra:false,
z:false,
max:false};

while(true){




if(/\s(?:-|\+)?[1-3]$/.test(choice)&&toID(choice)!=='conversion2'){
if(current.targetLoc)throw new Error("Move choice has multiple targets");
current.targetLoc=parseInt(choice.slice(-2),10);
choice=choice.slice(0,-2).trim();
}else if(choice.endsWith(' mega')){
current.mega=true;
choice=choice.slice(0,-5);
}else if(choice.endsWith(' zmove')){
current.z=true;
choice=choice.slice(0,-6);
}else if(choice.endsWith(' ultra')){
current.ultra=true;
choice=choice.slice(0,-6);
}else if(choice.endsWith(' dynamax')){
current.max=true;
choice=choice.slice(0,-8);
}else if(choice.endsWith(' max')){
current.max=true;
choice=choice.slice(0,-4);
}else{
break;
}
}

if(/^[0-9]+$/.test(choice)){

current.move=parseInt(choice,10);
}else{


var moveid=toID(choice);
if(moveid.startsWith('hiddenpower'))moveid='hiddenpower';

for(var i=0;i<moveRequest.moves.length;i++){
if(moveid===moveRequest.moves[i].id){
current.move=i+1;
break;
}
}
if(!current.move&&moveRequest.zMoves){
for(var _i2=0;_i2<moveRequest.zMoves.length;_i2++){
if(!moveRequest.zMoves[_i2])continue;
if(moveid===moveRequest.zMoves[_i2].id){
current.move=_i2+1;
current.z=true;
break;
}
}
}
if(!current.move&&moveRequest.maxMoves){
for(var _i3=0;_i3<moveRequest.maxMoves.length;_i3++){
if(moveid===moveRequest.maxMoves[_i3].id){
current.move=_i3+1;
current.max=true;
break;
}
}
}
}
if(current.max&&!moveRequest.canDynamax)current.max=false;
return current;
}

if(choice.startsWith('switch ')||choice.startsWith('team ')){
choice=choice.slice(choice.startsWith('team ')?5:7);
var isTeamPreview=request.requestType==='team';
var _current={
choiceType:isTeamPreview?'team':'switch',
targetPokemon:0};

if(/^[0-9]+$/.test(choice)){

_current.targetPokemon=parseInt(choice,10);
}else{

var lowerChoice=choice.toLowerCase();
var choiceid=toID(choice);
var matchLevel=0;
var match=0;
for(var _i4=0;_i4<request.side.pokemon.length;_i4++){
var serverPokemon=request.side.pokemon[_i4];
var curMatchLevel=0;
if(choice===serverPokemon.name){
curMatchLevel=10;
}else if(lowerChoice===serverPokemon.name.toLowerCase()){
curMatchLevel=9;
}else if(choiceid===toID(serverPokemon.name)){
curMatchLevel=8;
}else if(choiceid===toID(serverPokemon.speciesForme)){
curMatchLevel=7;
}else if(choiceid===toID(Dex.species.get(serverPokemon.speciesForme).baseSpecies)){
curMatchLevel=6;
}
if(curMatchLevel>matchLevel){
match=_i4+1;
matchLevel=curMatchLevel;
}
}
if(!match){
throw new Error("Couldn't find Pok\xE9mon \""+choice+"\" to switch to");
}
_current.targetPokemon=match;
}
if(!isTeamPreview&&_current.targetPokemon-1<this.requestLength()){
throw new Error("That Pok\xE9mon is already in battle!");
}
var target=request.side.pokemon[_current.targetPokemon-1];
if(!target){
throw new Error("Couldn't find Pok\xE9mon \""+choice+"\" to switch to!");
}
if(target.fainted){
throw new Error(target+" is fainted and cannot battle!");
}
return _current;
}

if(choice==='pass')return null;

throw new Error("Unrecognized choice \""+choice+"\"");
};_proto.




stringChoice=function stringChoice(choice){
if(!choice)return"pass";
switch(choice.choiceType){
case'move':
var target=choice.targetLoc?" "+(choice.targetLoc>0?'+':'')+choice.targetLoc:"";
var boost=""+(choice.max?' max':'')+(choice.mega?' mega':'')+(choice.z?' zmove':'');
return"move "+choice.move+boost+target;
case'switch':
case'team':
return choice.choiceType+" "+choice.targetPokemon;
case'shift':
return"shift";}

};BattleChoiceBuilder.












fixRequest=function fixRequest(request,battle){
if(!request.requestType){
request.requestType='move';
if(request.forceSwitch){
request.requestType='switch';
}else if(request.teamPreview){
request.requestType='team';
}else if(request.wait){
request.requestType='wait';
}
}

if(request.requestType==='wait')request.noCancel=true;
if(request.side){for(var _i5=0,_request$side$pokemon=
request.side.pokemon;_i5<_request$side$pokemon.length;_i5++){var serverPokemon=_request$side$pokemon[_i5];
battle.parseDetails(serverPokemon.ident.substr(4),serverPokemon.ident,serverPokemon.details,serverPokemon);
battle.parseHealth(serverPokemon.condition,serverPokemon);
}
}

if(request.active){
request.active=request.active.map(
function(active,i){return request.side.pokemon[i].fainted?null:active;});for(var _i6=0,_request$active=

request.active;_i6<_request$active.length;_i6++){var active=_request$active[_i6];
if(!active)continue;for(var _i7=0,_active$moves=
active.moves;_i7<_active$moves.length;_i7++){var move=_active$moves[_i7];
if(move.move)move.name=move.move;
move.id=toID(move.name);
}
if(active.maxMoves){
if(active.maxMoves.maxMoves){
active.canGigantamax=active.maxMoves.gigantamax;
active.maxMoves=active.maxMoves.maxMoves;
}for(var _i8=0,_active$maxMoves=
active.maxMoves;_i8<_active$maxMoves.length;_i8++){var _move=_active$maxMoves[_i8];
if(_move.move)_move.name=Dex.moves.get(_move.move).name;
_move.id=toID(_move.name);
}
}
if(active.canZMove){
active.zMoves=active.canZMove;for(var _i9=0,_active$zMoves=
active.zMoves;_i9<_active$zMoves.length;_i9++){var _move2=_active$zMoves[_i9];
if(!_move2)continue;
if(_move2.move)_move2.name=_move2.move;
_move2.id=toID(_move2.name);
}
}
}
}
};return BattleChoiceBuilder;}();
//# sourceMappingURL=battle-choices.js.map