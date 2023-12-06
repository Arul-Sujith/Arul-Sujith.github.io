function binAdd(a, b) {
    const binaryA = a.toString(2).padStart(8, '0');
    const binaryB = b.toString(2).padStart(8, '0');
    const c = (parseInt(binaryA, 2) + parseInt(binaryB, 2)).toString(2).padStart(8, '0');
    const result = parseInt(c.slice(-8), 2).toString(16);
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

function splitPlaintext(plainText) {
    const reversedBlocks = [];
    for (let i = plainText.length; i > 0; i -= 16) {
        const block = plainText.slice(Math.max(0, i - 16), i);
        reversedBlocks.push(block); }
    return reversedBlocks.reverse();
}

function initialTransformation(plainText, wkValues) {
    const xValues = [];
    plainText = plainText.reverse();
    wkValues = wkValues.reverse();

    const x0 = binAdd(parseInt(plainText[0][2], 2).toString(2), parseInt(wkValues[0][2], 2).toString(2)).padStart(2, '0');
    const x4 = binAdd(parseInt(plainText[4][2], 2).toString(2), parseInt(wkValues[2][2], 2).toString(2)).padStart(2, '0');
    const x2 = (parseInt(plainText[2][2], 2) ^ parseInt(wkValues[1][2], 2)).toString(16).padStart(2, '0');
    const x6 = (parseInt(plainText[6][2], 2) ^ parseInt(wkValues[3][2], 2)).toString(16).padStart(2, '0');

    xValues.push(['X0,0', x0], ['X0,1', plainText[1][1]], ['X0,2', x2], ['X0,3', plainText[3][1]], ['X0,4', x4], ['X0,5', plainText[5][1]], ['X0,6', x6], ['X0,7', plainText[7][1]]);
    return xValues;
}

function encryption(cipherValues, SKValues) {
    for (let i = 0; i < 32; i++) {
        const [X_i_0, X_i_1, X_i_2, X_i_3, X_i_4, X_i_5, X_i_6, X_i_7] = cipherValues.slice(-8).map(entry => parseInt(entry[1], 16));
        const [SK_4i_0, SK_4i_1, SK_4i_2, SK_4i_3] = SKValues.slice(4 * i, 4 * (i + 1)).map(skValue => (parseInt(skValue, 16)).toString(16));

        if (i === 31) {
            const x1 = binAdd(X_i_1.toString(2), (f1(X_i_0) ^ parseInt(SK_4i_0, 16))).padStart(2, '0');
            const x5 = binAdd(X_i_5.toString(2), (f1(X_i_4) ^ parseInt(SK_4i_2, 16))).padStart(2, '0');
            const x3 = (X_i_3 ^ parseInt(binAdd(f0(X_i_2), parseInt(SK_4i_1, 16)), 16)).toString(16).padStart(2, '0');
            const x7 = (X_i_7 ^ parseInt(binAdd(f0(X_i_6), parseInt(SK_4i_3, 16)), 16)).toString(16).padStart(2, '0');
            cipherValues.push(['X' + (i + 1) + ',0', (X_i_0).toString(16).padStart(2, '0')], ['X' + (i + 1) + ',1', x1], ['X' + (i + 1) + ',2', (X_i_2).toString(16).padStart(2, '0')], ['X' + (i + 1) + ',3', x3], ['X' + (i + 1) + ',4', (X_i_4).toString(16).padStart(2, '0')], ['X' + (i + 1) + ',5', x5], ['X' + (i + 1) + ',6', (X_i_6).toString(16).padStart(2, '0')], ['X' + (i + 1) + ',7', x7]);
        
        } else {
            const x0 = (X_i_7 ^ parseInt(binAdd(f0(X_i_6), parseInt(SK_4i_3, 16)), 16)).toString(16).padStart(2, '0');
            const x4 = (X_i_3 ^ parseInt(binAdd(f0(X_i_2), parseInt(SK_4i_1, 16)), 16)).toString(16).padStart(2, '0');
            const x2 = binAdd(X_i_1.toString(2), (f1(X_i_0) ^ parseInt(SK_4i_0, 16))).padStart(2, '0');
            const x6 = binAdd(X_i_5.toString(2), (f1(X_i_4) ^ parseInt(SK_4i_2, 16))).padStart(2, '0');
            cipherValues.push(['X' + (i + 1) + ',0', x0], ['X' + (i + 1) + ',1', (X_i_0).toString(16).padStart(2, '0')], ['X' + (i + 1) + ',2', x2], ['X' + (i + 1) + ',3', (X_i_2).toString(16).padStart(2, '0')], ['X' + (i + 1) + ',4', x4], ['X' + (i + 1) + ',5', (X_i_4).toString(16).padStart(2, '0')], ['X' + (i + 1) + ',6', x6], ['X' + (i + 1) + ',7', (X_i_6).toString(16).padStart(2, '0')]);
        }
    }
    return cipherValues;
}

function final_transformation(cipher_values, wk_values) {
    cipher_values = cipher_values.slice().reverse();
    wk_values = wk_values.slice().reverse();

    const x0 = binAdd(parseInt(cipher_values[7][1], 16), parseInt(wk_values[3][1], 16)).padStart(2, '0');
    const x4 = binAdd(parseInt(cipher_values[3][1], 16), parseInt(wk_values[1][1], 16)).padStart(2, '0');
    const x2 = (parseInt(cipher_values[5][1], 16) ^ parseInt(wk_values[2][1], 16)).toString(16).padStart(2, '0');
    const x6 = (parseInt(cipher_values[1][1], 16) ^ parseInt(wk_values[0][1], 16)).toString(16).padStart(2, '0');

    cipher_values = cipher_values.reverse();
    cipher_values.push(['X33,0', x0], ['X33,1', cipher_values[257][1]], ['X33,2', x2], ['X33,3', cipher_values[259][1]], ['X33,4', x4], ['X33,5', cipher_values[261][1]], ['X33,6', x6], ['X33,7', cipher_values[263][1]]);

    return cipher_values;
}

function getInputAndRunFunctions() {
    const m_key = globalMasterKey;
    const plainText = globalPlainText;
    const δ_values = generateSandDelta();
    var { mkValues, wkValues } = keys(m_key);
    const MK_Values = mkValues.map(mk => parseInt(mk[1], 16));
    const SKValues = generateSK(MK_Values, δ_values);

    const blocks = splitPlaintext(plainText);
    const paddedblocks = []
    for (var i = 0; i < blocks.length; i++) {
        var block = blocks[i];
        while (block.length < 16) {
            block = "0" + block; }
        paddedblocks.push(block)
    }

    const ptValues = [];
    for (var i = 0; i < paddedblocks.length; i++) {
        var block = paddedblocks[i];
        const byteValuesPT = Array.from({ length: block.length / 2 }, (_, i) => block.slice(i * 2, (i + 1) * 2));

        const ptValue = []
        for (let j = 0; j < byteValuesPT.length; j++) {
            const ptName = `PT${j.toString().padStart(2, '0')}`;
            const ptHex = byteValuesPT[j];
            const ptBin = parseInt(ptHex, 16).toString(2).padStart(8, '0');
            ptValue.push([ptName, ptHex, ptBin]); }
        ptValues.push(ptValue)
    }

    const encryptedBlocks = []; 

    for (var i = 0; i < ptValues.length; i++) {
        var cipherValues1 = [];
        var cipherValues2 = [];
        var cipherValues3 = [];
        var ptValuesBlock = ptValues[i];

        wkValues = (i != 0) ? wkValues.reverse() : wkValues;
        var cipherValues1 = initialTransformation(ptValuesBlock, wkValues);
        console.log(i+1," = ",JSON.stringify(wkValues,null,2))
        var cipherValues2 = encryption(cipherValues1, SKValues);
        var cipherValues3 = final_transformation(cipherValues2, wkValues);
        const encryptedPart = cipherValues3.slice(264, 272).map(entry => entry[1]).join(" ");
        encryptedBlocks.push(encryptedPart.split(' ').reverse().join(' '));
    }

    const encryptedText = encryptedBlocks.join(" ");
    displayCipherText(encryptedText);
}

function displayCipherText(encryptedText) {
    var cipherTextDisplay = document.getElementById("cipherTextDisplay");
    cipherTextDisplay.textContent = "Cipher Text: " + encryptedText;
}
