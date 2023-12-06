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

function keys(m_key) {
    const byteValues = Array.from({ length: m_key.length / 2 }, (_, i) => m_key.slice(i * 2, (i + 1) * 2));
    const mkValues = [];
    const wkValues = [];

    for (let i = 0; i < byteValues.length; i++) {
        const mkName = `MK${i.toString().padStart(2, '0')}`;
        const mkHex = byteValues[i];
        const mkBin = parseInt(mkHex, 16).toString(2).padStart(8, '0');
        mkValues.push([mkName, mkHex, mkBin]);
    }

    for (let i = 0; i < 8; i++) {
        const wkIndex = (i <= 3) ? i + 12 : i - 4;
        const wkName = `WK${i.toString().padStart(2, '0')}`;
        const wkHex = byteValues[wkIndex];
        const wkBin = parseInt(wkHex, 16).toString(2).padStart(8, '0');
        wkValues.push([wkName, wkHex, wkBin]);
    }
    return { mkValues, wkValues };
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

function splitCiphertext(cipherText) {
    const reversedBlocks = [];
    for (let i = cipherText.length; i > 0; i -= 16) {
        const block = cipherText.slice(Math.max(0, i - 16), i);
        reversedBlocks.push(block); }
    return reversedBlocks.reverse();
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
    return values;
}

function getInputAndRunFunctions() {
    const m_key = globalMasterKey;
    const cipherText = globalCipherText;
    const δ_values = generateSandDelta();
    var { mkValues, wkValues } = keys(m_key);
    wkValues = wkValues.reverse()
    const MK_Values = mkValues.map(mk => parseInt(mk[1], 16));
    var SKValues = generateSK(MK_Values, δ_values);
    
    const blocks = splitCiphertext(cipherText);
    const paddedblocks = []
    for (var i = 0; i < blocks.length; i++) {
        var block = blocks[i];
        while (block.length < 16) {
            block = "0" + block; }
        paddedblocks.push(block)
    }

    var ctValues = [];
    for (var i = 0; i < paddedblocks.length; i++) {
        var block = paddedblocks[i];
        const byteValuesCT = Array.from({ length: block.length / 2 }, (_, i) => block.slice(i * 2, (i + 1) * 2));

        const ctValue = []
        for (let j = 0; j < byteValuesCT.length; j++) {
            const ctName = `PT${j.toString().padStart(2, '0')}`;
            const ctHex = byteValuesCT[j];
            const ctBin = parseInt(ctHex, 16).toString(2).padStart(8, '0');
            ctValue.push([ctName, ctHex, ctBin]); }
        ctValues.push(ctValue)
    }

    const decryptedBlocks = []; 
    for (var i = 0; i < ctValues.length; i++) {
        var cipherValues1 = [];
        var cipherValues2 = [];
        var cipherValues3 = [];
        var ctValuesBlock = ctValues[i];
        
        ctValuesBlock = ctValuesBlock.reverse();
        SKValues = (i != 0) ? SKValues.reverse() : SKValues;
        var cipherValues1 = final_transformation(ctValuesBlock, wkValues);
        var cipherValues2 = encryption(cipherValues1, SKValues);
        var cipherValues3 = initialTransformation(cipherValues2, wkValues);
        const encryptedPart = cipherValues3.slice(0, 8).map(entry => entry[1]).join(" ");
        decryptedBlocks.push(encryptedPart.split(' ').reverse().join(' '));
    }

    const decryptedText = decryptedBlocks.join(" ");
    displayCipherText(decryptedText);
}

function displayCipherText(decryptedText) {
    var cipherTextDisplay = document.getElementById("plainTextDisplay");
    cipherTextDisplay.textContent = "Plain Text: " + decryptedText;
}
