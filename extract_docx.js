const mammoth = require("mammoth");
const fs = require("fs");

mammoth.extractRawText({path: "Use Case全部.docx"})
    .then(function(result){
        fs.writeFileSync("use_case_extracted.txt", result.value);
        console.log("Done");
    })
    .catch(function(error) {
        console.error(error);
    });
