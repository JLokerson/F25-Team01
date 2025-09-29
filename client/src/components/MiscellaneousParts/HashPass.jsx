

// Swiped most of this method from the web, then made slight modifications.
// To quote one of my professors: "Never roll your own crypto."
async function digestMessage(message) {
    const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgUint8); // hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""); // convert bytes to hex string
return hashHex;
}


// hashes twice to protect against length extension attacks.
// Though it would not be immediately obvious as to how one
// could be of merit here, the added protection seemed wise
// since it was easy to implement it.
export default async function HashPassword(passwd,salt){
    return await digestMessage(await digestMessage(passwd + salt));
}


// Password salt generation methods stored down here
export function GenerateSalt(){
    const SaltLength = 20;
    let val = "";
    for (let x = 0; x < 20; x++){
        val = val + RandomChar();
    }
    return val;
}

// Handles byte selection.
function RandomChar(){
    const MAX_VAL = 26;
    const ASCII_A = 65;
    let rand = math.random() * MAX_VAL;
    rand = math.floor(MAX_VAL)  + ASCII_A;
    return String.fromCharCode(rand);
}