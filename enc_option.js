// Global variables to store masterKey and plainText
var globalMasterKey;
var globalPlainText;
var globalIV;

function getInputAndRunFunctions() {
    // Get input values
    globalMasterKey = document.getElementById("masterKey").value.replace(/ /g, "");
    globalPlainText = document.getElementById("plainText").value.replace(/ /g, "");

    // Check if IV input is visible
    var ivInput = document.getElementById("ivInput");
    if (ivInput.style.display === "block") {
        globalIV = document.getElementById("iv").value.replace(/ /g, "");
    }

    // Pad the masterKey to 32 characters
    globalMasterKey = padToLength(globalMasterKey, 32);

    // Pad the IV to 32 characters
    globalIV = padToLength(globalIV, 32);

    // Pad the plainText to at least 16 characters
    if (globalPlainText.length<16){
        globalPlainText = padToLength(globalPlainText, 16);
    }

    function padToLength(value, targetLength) {
        if (!value) {
            value = ""; // Set value to an empty string if it's undefined or null
        }
        //if (value.length >= targetLength) {
            //return value.slice(0, targetLength);
        //} else 
        {   
            const padding = '0'.repeat(targetLength - value.length);
            return padding + value;
        }
    }
    
    // Get selected encryption mode
    var selectedOption = document.getElementById("encryptionMode").value;

    // Dynamically load the corresponding JavaScript file based on the selected option
    var scriptElement = document.createElement("script");

    scriptElement.onload = function () {
        // Call the function from the dynamically loaded script
        if (typeof window[selectedOption] !== "undefined" && typeof window[selectedOption].getInputAndRunFunctions === "function") {
            window[selectedOption].getInputAndRunFunctions();
        } //else {
            //console.error("Function not found in the dynamically loaded script");
        //}
    };

    switch (selectedOption) {   
        case "option1":
            scriptElement.src = "ECB_encryption.js";
            break;
        case "option2":
            scriptElement.src = "option2.js";
            break;
        case "option3":
            scriptElement.src = "option2.js";
            break;
        case "option4":
            scriptElement.src = "option2.js";
            break;
        case "option5":
            scriptElement.src = "option2.js";
            break;
        // Add cases for other options...

        default:
            console.error("Invalid option selected");
            return;
    }

    // Append the script element to the document body
    document.body.appendChild(scriptElement);
}
