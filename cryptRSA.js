function myRSA()
{
    //Generate Privte key by hashing/mangled the password phrase 
    //using SHA-256 to produce the seed for the random prime number of private key
    var myRSAPrivateKey = cryptico.generateRSAKey('passwordPhrase', 1024);
    //Find public key
    var senderPublicKey = cryptico.publicKeyString(myRSAPrivateKey);

    console.log(myRSAPrivateKey.p);
    console.log(myRSAPrivateKey.q);

}//End function