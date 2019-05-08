// Get a reference to the database service
var databaseRoot = firebase.database();
var myRSAKey; //Private key
var myId;
const bigInt = require('big-integer');
class RSA{

static agregarUsuario()
{
    var userId = document.getElementById('name').value;
    myId = userId;

    var passwordPhrase = document.getElementById('passp').value;
    var bits = document.getElementById('bits').value;

    var timeStart = new Date();
    //Generate Privte key by hashing/mangled the password phrase 
    //using SHA-256 to produce the seed for the random prime number of private key
    myRSAKey = cryptico.generateRSAKey(passwordPhrase, bits);
    //Find public key
    var senderPublicKey = cryptico.publicKeyString(myRSAKey);
    var timeEnds = new Date();

    var totalTime = timeEnds-timeStart;
    
    firebase.database().ref('users/' + userId).set({
        publicKey: senderPublicKey
      });

      console.log(myRSAKey.p);
      console.log(myRSAKey.q);
    alert("Public key generated for "+userId+" in "+totalTime+" milliseconds : "+senderPublicKey);
    displayDirectory();

}//End function agregarUsuario
//-----------------------------------------------------------
async static displayDirectory()
{
    var htmlli = "";
    var publicKeyOtherUser;
    databaseRoot.ref('users/').on('value', function(snapshot){
      snapshot.forEach(function(child){
        publicKeyOtherUser = child.toJSON().publicKey;
        //child.Key.substr(0,1) en chatWith() para que aparezacan en el directorio todos los contactos (hasta los de id de 2 palabras)
        htmlli = htmlli+"<li><a href='javascript:undefined' onClick=chatWith('"+child.key+"','"+publicKeyOtherUser+"')>"+child.key+": '"+publicKeyOtherUser.substr(0,30)+"'...</a></li>";
        //------------
        //console.log(child.key);
        //console.log(child.toJSON().publicKey);
        //-------
      });

      console.log("Pre-Fin");
      $('#directoryList').replaceWith("<ul id='directoryList'>"+htmlli+"</ul>");

    });

    var html = "<form class='contact100-form validate-form' id='formulario'><span class='contact100-form-title'>Welcome "+myId+"! Directory:</span>"+
               "<div class='container-contact100-form-btn'><ul id='directoryList'>"+htmlli+"</ul></div><div class='container-contact100-form-btn'>"+
               "<button class='contact100-form-btn' onClick=displayDirectory()>Directorio</button></div></form>";

    var htmlImage = "<div class='contact100-pic js-tilt' id='divImg' data-tilt> <img src='images/img-01.png' alt='IMG'> </div>";

    console.log("Fin");
    $('#formulario').replaceWith(html);
    $('#divImg').replaceWith(htmlImage);

}//End function display directory
//------------------------------------------------------------
static chatWith(idUser,publicKeyOther)
{
  var html = "<form class='contact100-form validate-form' id='formulario'><span class='contact100-form-title'>You: "+myId+"</span>"+
               "<div class='container-contact100-form-btn'></div><div class='container-contact100-form-btn'>"+
               "<button class='contact100-form-btn' onClick=displayDirectory()>Directorio</button></div>"+
               "<div class='container-contact100-form-btn'><input class='input100' type='text' id='inputSend'>"+
               "<span class='focus-input100'></span><span class='symbol-input100'></span></div>"+
               "<div class='container-contact100-form-btn'><button type='button' class='contact100-form-btn' onClick= sendMessageTo('"+idUser+"','"+publicKeyOther+"') >Send</button></div>"+
               "</form>";

  var htmlChatBox = "<div class='contact100-pic js-tilt' id='divImg' data-tilt> <span class='contact100-form-title'>Chat with: "+idUser+"</span> <div class='wrap-input100 validate-input'>"+
  "<textarea class='input100' id='messages' readonly></textarea><span class='focus-input100'></span></div>"+
  "<div class='container-contact100-form-btn'><button class='contact100-form-btn' onClick=resolveMessageFrom('"+idUser+"') >Resolve</button></div>  </div>";

  $('#formulario').replaceWith(html);             
  $('#divImg').replaceWith(htmlChatBox);

}//EndFunction chatWith
//------------------------------------------------------------
static sendMessageTo(idRecivever,pkey)
{
  var message = document.getElementById('inputSend').value;
  var chatbox;

  var timeStart = new Date();
  //EncryptMessage
  var codemsg = encode(message);
  var ciphermsg = encrypt(codemsg,pkey.n,pkey.e);
  var timeEnds = new Date();

  console.log("Public key user to which is send the message:");
  console.log(pkey);

  var totalTime = timeEnds-timeStart;
  console.log("Time that took to perform the encryption (miliseconds): "+totalTime);

  //Historial mensjaes
  var newpostRef = databaseRoot.ref('messages/').push();

  newpostRef.set({
      msg: ciphermsg.cipher,
      sender: myId,
      recvr: idRecivever
  });

  //Ultimo mensaje recibido por myId
  firebase.database().ref('users/' + idRecivever+'/'+myId+'lastmsg').set({
    msg: ciphermsg.cipher
  });

  //Update messages chatbox
  //Obtener todos los mensajes actuales en chatbox
  chatbox = document.getElementById('messages').value;
  //Cargar nuevo mensaje enviado
  chatbox = chatbox + "You: "+ message +"\n";
  document.getElementById('messages').value = chatbox;

  //Clear message that was sent
  document.getElementById('inputSend').value = "";

}///End function sendMessageTo
//------------------------------------------------------------
static resolveMessageFrom(id)
{
  var cipherText;
  var decryptMessage;
  var decodeMsg;

  //Get Last Message from chat with user with id: id
  databaseRoot.ref('users/'+myId+'/'+id+'lastmsg').on('value', function(snapshot){
    console.log(snapshot.toJSON());
    //alert("Yo: "+myId+" quiero el ultimo mensaje de "+id+" : "+snapshot.toJSON().msg);
    alert("Desencriptando el mensaje recibido de "+id+" : "+snapshot.toJSON().msg);
    cipherText = snapshot.toJSON().msg;
  });
  
  var timeStart = new Date();
  //Decryption
  decryptMessage = decrypt(cipherText,myRSAKey.d, myRSAKey.n);
  decodeMsg = decode(decryptMessage);
  var timeEnds = new Date();

  var totalTime = timeEnds-timeStart;
  console.log("Time that took to perform the decryption (miliseconds): "+totalTime);

  //Update messages chatbox
  //Obtener todos los mensajes actuales en chatbox
  var chatbox = document.getElementById('messages').value;
  //Cargar nuevo mensaje enviado
  chatbox = chatbox+id+": "+ decodeMsg.plaintext +"\n";
  document.getElementById('messages').value = chatbox;

}//End function

static encrypt(encodedMsg, n, e) {
  return bigInt(encodedMsg).modPow(e, n);
}


static encode(str) {
  const codes = str
    .split('')
    .map(i => i.charCodeAt())
    .join('');

  return bigInt(codes);
}

static  decrypt(encryptedMsg, d, n) {
  return bigInt(encryptedMsg).modPow(d, n); 
}

static  decode(code) {
  const stringified = code.toString();
  let string = '';

  for (let i = 0; i < stringified.length; i += 2) {
    let num = Number(stringified.substr(i, 2));
    
    if (num <= 30) {
      string += String.fromCharCode(Number(stringified.substr(i, 3)));
      i++;
    } else {
      string += String.fromCharCode(num);
    }
  }

  return string;
}
}