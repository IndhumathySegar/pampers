const express = require('express');
const fs = require('fs');

const app = express();
const PORT = 3000; // You can change the port if needed

// API Endpoint
app.get('/get-data', (req, res) => {
    try {
        // Read JSON file
        const rawData = fs.readFileSync('reviewerdata.json', 'utf8');
        const exportedData = JSON.parse(rawData);
        console.log("=======", exportedData)
        // Process data
        let transformedData = [];

        exportedData.forEach(x => {
            if (x.data && Array.isArray(x.data.content) && x.data.content.length) {
                x.data.content.forEach(y => {
                    transformedData.push({
                        "Content Model": y.contentModelName ? y.contentModelName : "",
                        "Entry Title": y.label ? y.label : "",
                        "Field Name": y.key ? y.key : "",
                        "Original content": y.value ? y.value : "",
                        "Translated content": y.translatedValue ? y.translatedValue : "",
                        "Final content": y.replacedValue ? y.replacedValue : "",
                        "Entry Id": y.entryId ? y.entryId : "",
                        "Source Locale": y.locale ? y.locale : "",
                        "Destination Locale": x.data.destLocale ? x.data.destLocale : "",
                    });
                });
            }
        });

        // Send response to Postman
        res.json({ success: true, data: transformedData });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error reading or processing data', error: error.message });
    }
});


function getTranslatedData(data){
    data = data.existingValue ? data.existingValue : data.translatedValue;
    if(Array.isArray(data.content) && data.content.length){
        return data.content
        .flatMap(item => item.content) 
        .map(contentItem => contentItem.value) 
        .join(" ");
    }else{
        return data;
    }
}
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
