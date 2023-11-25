function binAdd(a, b) {
    const binaryA = a.toString(2).padStart(8, '0');
    const binaryB = b.toString(2).padStart(8, '0');
    const c = (parseInt(binaryA, 2) + parseInt(binaryB, 2)).toString(2).padStart(8, '0');
    const result = parseInt(c.slice(-8), 2).toString(16);
    return result;
}

function binSUB(a, b) {
    const binaryA = String(a).padStart(8, '0');
    const binaryB = String(b).padStart(8, '0');
    const intValueA = parseInt(binaryA, 2);
    const intValueB = parseInt(binaryB, 2);
    let result;
    if (intValueA < intValueB) {
        result = (intValueA + 256 - intValueB).toString(16);
    } else {
        result = (intValueA - intValueB).toString(16);
    }
    return result;
}


function f0(x) {
    const binaryX = (x >>> 0).toString(2).padStart(8, '0');
    const result = parseInt(binaryX.slice(1) + binaryX.slice(0, 1), 2) ^ parseInt(binaryX.slice(2) + binaryX.slice(0, 2), 2) ^ parseInt(binaryX.slice(7) + binaryX.slice(0, 7), 2);
    return result;
}

function f1(x) {
    const binaryX = (x >>> 0).toString(2).padStart(8, '0');
    const result = parseInt(binaryX.slice(3) + binaryX.slice(0, 3), 2) ^ parseInt(binaryX.slice(4) + binaryX.slice(0, 4), 2) ^ parseInt(binaryX.slice(6) + binaryX.slice(0, 6), 2);
    return result;
}

function generateSandDelta() {
    let s = [1, 0, 1, 1, 0, 1, 0];
    let delta = [];
    let delta_i = s.join('');
    delta.push(delta_i);

    for (let _ = 0; _ < 128; _++) {
        let s_next = s[3] ^ s[s.length - 1];
        delta_i = [s_next, ...s.slice(0, -1)].join('');
        s = [s_next, ...s.slice(0, -1)];
        delta.push(delta_i);
    }
    return delta;
}

function keys(m_key, plainText) {
    //const m_key = "ff ee dd cc bb aa 99 88 77 66 55 44 33 22 11 00".replace(/ /g, "");
    //const plainText = "23ce9f72e543e6d8".replace(/ /g, "");
    //const m_key = document.getElementById('masterKey').value.replace(/ /g, "");
    const byteValues = Array.from({ length: m_key.length / 2 }, (_, i) => m_key.slice(i * 2, (i + 1) * 2));
    //const plainText = document.getElementById('plainText').value.replace(/ /g, "");
    const byteValuesPT = Array.from({ length: plainText.length / 2 }, (_, i) => plainText.slice(i * 2, (i + 1) * 2));
    const mkValues = [];
    const wkValues = [];
    const ptValues = [];

    for (let i = 0; i < byteValues.length; i++) {
        const mkName = `MK${i.toString().padStart(2, '0')}`;
        const mkHex = byteValues[i];
        const mkBin = parseInt(mkHex, 16).toString(2).padStart(8, '0');
        mkValues.push([mkName, mkHex, mkBin]);
    }

    for (let i = 0; i < byteValuesPT.length; i++) {
        const ptName = `PT${i.toString().padStart(2, '0')}`;
        const ptHex = byteValuesPT[i];
        const ptBin = parseInt(ptHex, 16).toString(2).padStart(8, '0');
        ptValues.push([ptName, ptHex, ptBin]);
    }

    for (let i = 0; i < 8; i++) {
        const wkIndex = (i <= 3) ? i + 12 : i - 4;
        const wkName = `WK${i.toString().padStart(2, '0')}`;
        const wkHex = byteValues[wkIndex];
        const wkBin = parseInt(wkHex, 16).toString(2).padStart(8, '0');
        wkValues.push([wkName, wkHex, wkBin]);
    }
    return { mkValues, wkValues, ptValues };
}

function generateSK(MK, deltaValues) {
    const SK = Array(128).fill(0);
    MK = MK.reverse();

    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const A = (MK[(j - i + 8) % 8]).toString(2);
            const B = parseInt(deltaValues[16 * i + j], 2).toString(2);
            const index = 16 * i + j;
            const add = binAdd(A, B);
            SK[index] = add;
        }

        for (let j = 0; j < 8; j++) {
            const A = (MK[((j - i + 8) % 8) + 8]).toString(2);
            const B = parseInt(deltaValues[16 * i + j + 8], 2).toString(2);
            const index = 16 * i + j + 8;
            const add = binAdd(A, B);
            SK[index] = add;
        }
    }
    return SK;
}

function initialTransformation(cipher_values, wkValues) {
    const xValues = [];
    cipher_values = cipher_values.reverse();

    const x0 = binSUB(parseInt(cipher_values[7][1], 16).toString(2), parseInt(wkValues[0][1], 16).toString(2)).padStart(2, '0');
    const x4 = binSUB(parseInt(cipher_values[3][1], 16).toString(2), parseInt(wkValues[2][1], 16).toString(2)).padStart(2, '0');
    const x2 = (parseInt(cipher_values[5][1], 16) ^ parseInt(wkValues[1][1], 16)).toString(16).padStart(2, '0');
    const x6 = (parseInt(cipher_values[1][1], 16) ^ parseInt(wkValues[3][1], 16)).toString(16).padStart(2, '0');

    xValues.push(['Y33,0', x0], ['Y33,1', cipher_values[6][1]], ['Y33,2', x2], ['Y33,3', cipher_values[4][1]], ['Y33,4', x4], ['Y33,5', cipher_values[2][1]], ['Y33,6', x6], ['Y33,7', cipher_values[0][1]]);
    return xValues;
}


function encryption(cipherValues, SKValues) {
    SKValues = SKValues.reverse()
    for (let i = 0; i < 32; i++) {
        const [X_i_0, X_i_1, X_i_2, X_i_3, X_i_4, X_i_5, X_i_6, X_i_7] = cipherValues.slice(-8).map(entry => parseInt(entry[1], 16));
        const [SK_4i_3, SK_4i_2, SK_4i_1, SK_4i_0] = SKValues.slice(4 * i, 4 * (i + 1)).map(skValue => (parseInt(skValue, 16)).toString(16));

        if (i === 0) {
            const x1 = binSUB(X_i_1.toString(2), (f1(X_i_0) ^ parseInt(SK_4i_0, 16)).toString(2)).padStart(2, '0');
            const x5 = binSUB(X_i_5.toString(2), (f1(X_i_4) ^ parseInt(SK_4i_2, 16)).toString(2)).padStart(2, '0');
            const x3 = (X_i_3 ^ parseInt(binAdd(f0(X_i_2), parseInt(SK_4i_1, 16)), 16)).toString(16).padStart(2, '0');
            const x7 = (X_i_7 ^ parseInt(binAdd(f0(X_i_6), parseInt(SK_4i_3, 16)), 16)).toString(16).padStart(2, '0');
            cipherValues.push(['Y' + (i + 1) + ',0', (X_i_0).toString(16).padStart(2, '0')], ['Y' + (i + 1) + ',1', x1], ['Y' + (i + 1) + ',2', (X_i_2).toString(16).padStart(2, '0')], ['Y' + (i + 1) + ',3', x3], ['Y' + (i + 1) + ',4', (X_i_4).toString(16).padStart(2, '0')], ['Y' + (i + 1) + ',5', x5], ['Y' + (i + 1) + ',6', (X_i_6).toString(16).padStart(2, '0')], ['Y' + (i + 1) + ',7', x7]);
        
        } else {
            const x0 = (X_i_0 ^ parseInt(binAdd(f0(X_i_7), parseInt(SK_4i_3, 16)), 16)).toString(16).padStart(2, '0');
            const x4 = (X_i_4 ^ parseInt(binAdd(f0(X_i_3), parseInt(SK_4i_1, 16)), 16)).toString(16).padStart(2, '0');
            const x2 = binSUB(X_i_2.toString(2), (f1(X_i_1) ^ parseInt(SK_4i_0, 16)).toString(2)).padStart(2, '0');
            const x6 = binSUB(X_i_6.toString(2), (f1(X_i_5) ^ parseInt(SK_4i_2, 16)).toString(2)).padStart(2, '0');
            cipherValues.push(['Y' + (i + 1) + ',0', (X_i_1).toString(16).padStart(2, '0')], ['Y' + (i + 1) + ',1', x2], ['Y' + (i + 1) + ',2', (X_i_3).toString(16).padStart(2, '0')], ['Y' + (i + 1) + ',3', x4], ['Y' + (i + 1) + ',4', (X_i_5).toString(16).padStart(2, '0')], ['Y' + (i + 1) + ',5', x6], ['Y' + (i + 1) + ',6', (X_i_7).toString(16).padStart(2, '0')], ['Y' + (i + 1) + ',7', x0]);
        }
    }
    return cipherValues;
}

function final_transformation(cipher_values, wk_values) {
    cipher_values = cipher_values.slice().reverse();

    const x0 = binSUB(parseInt(cipher_values[7][1], 16).toString(2), parseInt(wk_values[4][2], 2).toString(2)).padStart(2, '0');
    const x4 = binSUB(parseInt(cipher_values[3][1], 16).toString(2), parseInt(wk_values[6][2], 2).toString(2)).padStart(2, '0');
    const x2 = (parseInt(cipher_values[5][1], 16) ^ parseInt(wk_values[5][2], 2)).toString(16).padStart(2, '0');
    const x6 = (parseInt(cipher_values[1][1], 16) ^ parseInt(wk_values[7][2], 2)).toString(16).padStart(2, '0');

    cipher_values = cipher_values.reverse();
    const values = []
    values.push(['Y0,0', x0], ['Y0,1', cipher_values[1][1]], ['Y0,2', x2], ['Y0,3', cipher_values[3][1]], ['Y0,4', x4], ['Y0,5', cipher_values[5][1]], ['Y0,6', x6], ['Y0,7', cipher_values[7][1]]);
    //const encryptedText = cipher_values[263][1] + " " + cipher_values[262][1] + " " + cipher_values[261][1] + " " + cipher_values[260][1] + " " + cipher_values[259][1] + " " + cipher_values[258][1] + " " + cipher_values[257][1] + " " + cipher_values[256][1]
    //console.log(encryptedText)
    //document.getElementById('cipherTextOutput').innerHTML = "<p>Cipher Text: " + encryptedText + "</p>";
    return values;
}


//const δ_values = generateSandDelta();
//let { mkValues, wkValues, ptValues } = keys();
//ptValues = ptValues.reverse()
//wkValues = wkValues.reverse()
//const MK_Values = mkValues.map(mk => parseInt(mk[1], 16));
//const SKValues = generateSK(MK_Values, δ_values);
//const cipherValues1 = final_transformation(ptValues, wkValues);
//const cipherValues2 = encryption(cipherValues1, SKValues);
//const cipherValues3 = initialTransformation(cipherValues2, wkValues);
//console.log("\nCipher Text: ",ptValues[7][1],ptValues[6][1],ptValues[5][1],ptValues[4][1],ptValues[3][1],ptValues[2][1],ptValues[1][1],ptValues[0][1])
//console.log("Plain Text: ", cipherValues3[7][1],cipherValues3[6][1],cipherValues3[5][1],cipherValues3[4][1],cipherValues3[3][1],cipherValues3[2][1],cipherValues3[1][1],cipherValues3[0][1])


function getInputAndRunFunctions() {
    //var userInput = document.getElementById("myInput").value;
    const m_key = document.getElementById('masterKey').value.replace(/ /g, "");
    //console.log("m_key = ",m_key)
    const plainText = document.getElementById('cipherText').value.replace(/ /g, "");
    //console.log("cipherText = ",plainText)
    const δ_values = generateSandDelta();
    let { mkValues, wkValues, ptValues } = keys(m_key, plainText);
    ptValues = ptValues.reverse()
    wkValues = wkValues.reverse()
    const MK_Values = mkValues.map(mk => parseInt(mk[1], 16));
    const SKValues = generateSK(MK_Values, δ_values);
    const cipherValues1 = final_transformation(ptValues, wkValues);
    //console.log("cipherValues1 = ",cipherValues1)
    const cipherValues2 = encryption(cipherValues1, SKValues);
    const cipherValues3 = initialTransformation(cipherValues2, wkValues);
    //console.log(cipherValues3)
    //... continue with the rest of your code ...
    displayCipherText(cipherValues3);
}

function displayCipherText(cipher_values) {
    //console.log("cipher_values = ",JSON.stringify(cipher_values, null, 2))
    //console.log("cipher = ",cipher_values.length)
    const encryptedText = cipher_values[7][1] + " " + cipher_values[6][1] + " " + cipher_values[5][1] + " " + cipher_values[4][1] + " " + cipher_values[3][1] + " " + cipher_values[2][1] + " " + cipher_values[1][1] + " " + cipher_values[0][1]
    //console.log("Plain Text: ",encryptedText)
    var plainTextDisplay = document.getElementById("plainTextDisplay");
    plainTextDisplay.textContent = "Plain Text: " + encryptedText;
}
