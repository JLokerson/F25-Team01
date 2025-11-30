import { sha256 } from 'js-sha256';
// Swiped most of this method from the web, then made slight modifications.
// To quote one of my professors: "Never roll your own crypto."
async function digestMessage(message) {
    const hashHex = await sha256(message);
return hashHex;
}


// hashes twice to protect against length extension attacks.
// Though it would not be immediately obvious as to how one
// could be of merit here, the added protection seemed wise
// since it was easy to implement it.
export async function HashPassword(passwd, salt) {
    return await digestMessage(await digestMessage(passwd + salt));
}

// Password salt generation methods stored down here
export function GenerateSalt() {
    const SaltLength = 20;
    let val = "";
    for (let x = 0; x < SaltLength; x++) {
        val = val + RandomChar();
    }
    return val;
}

// Handles byte selection.
function RandomChar() {
    const MAX_VAL = 26;
    const ASCII_A = 65;
    let rand = new Uint32Array(1);
    crypto.getRandomValues(rand);
    rand = rand[0]
    return String.fromCharCode(rand);
}