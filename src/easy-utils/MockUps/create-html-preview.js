/* NOTE Add exports at the bottom of easy-utils.js to export EASY_MODULE_FORGE and EASY_UTILS for use here. */

import "./mock-roll20.js";
import { EASY_MODULE_FORGE } from "../easy-utils.js";
import { EASY_UTILS } from "../easy-utils.js";
import fs from "fs";

const moduleSettings = {
	readableName: "Preview-Modal",
	chatApiName: "",
	globalName: "",
	version: "1.0.0",
	author: "Mhykiel",
	verbose: false,
};

let outerInlineHtml = "";

function runPreview() {
	const replacePlaceholders = EASY_UTILS.getFunction({ functionName: "replacePlaceholders", moduleSettings });
	const convertCssToJson = EASY_UTILS.getFunction({ functionName: "convertCssToJson", moduleSettings });
	const convertHtmlToJson = EASY_UTILS.getFunction({ functionName: "convertHtmlToJson", moduleSettings });
	const applyCssToHtmlJson = EASY_UTILS.getFunction({ functionName: "applyCssToHtmlJson", moduleSettings });
	const convertJsonToHtml = EASY_UTILS.getFunction({ functionName: "convertJsonToHtml", moduleSettings });

	const css = `
:root {
    --ez-primary-color: #8655B6; 
    --ez-secondary-color: #17AEE8; 
    --ez-primary-background-color: #252B2C; 
    --ez-subdued-background-color: #F2F2F2; 
    --ez-overlay-text-color: #ffffff; 
    --ez-border-color: #000000; 
}

.menu-box {
    font-size: 1.2em;
    background-color: var(--ez-primary-background-color);
    border: 2px solid var(--ez-border-color);
    border-radius: 8px;
    padding: 10px;
    max-width: 100%;
    font-family: Arial, sans-serif;
    color: var(--ez-overlay-text-color);
    margin: 5px;
}

h3 {
    margin: 0;
    font-size: 1.2em;
    text-transform: uppercase;
    font-weight: bold;
    text-align: center;
    margin-bottom: 10px;
    color: var(--ez-overlay-text-color);
    background-color: var(--ez-primary-color);
    border: 2px solid var(--ez-border-color);
    border-radius: 5px;
    padding: 5px;
}

ul {
    list-style-type: none;
    padding: 0;
    margin: 0;
}

li {
    margin: 5px 0;
    width: 90%;
    background-color: var(--ez-secondary-color);
    border: 2px solid var(--ez-border-color);
    color: var(--ez-overlay-text-color);
    padding: 5px 10px;
    border-radius: 5px;
    cursor: pointer;
    box-sizing: border-box;
}

li:nth-child(even) {
    background-color: var(--ez-primary-color);
}
`;

	const html = `
<div class="menu-box">
    <h3>{{ title }}</h3>
    <ul>
        <li>{{ menuItems }}</li>
    </ul>
    <p class="menu-footer">{{ footer }}</p>
</div>
`;

	const resolvedCss = replacePlaceholders({
		string: css,
		cssVars: {
			"--ez-primary-color": "#66FF66",
			"--ez-secondary-color": "#66FFFF",
			"--ez-primary-background-color": "#ffffe6",
		},
	});

	const resolvedHtml = replacePlaceholders({
		string: html,
		expressions: {
			title: "A Menu",
			menuItems: "Some Stuff...",
			footer: "A footer.",
		},
	});

	const cssJson = convertCssToJson({ css: resolvedCss });
	const htmlJson = convertHtmlToJson({ html: resolvedHtml });

	const styledHtmlJson = applyCssToHtmlJson({ cssJson, htmlJson });
	const inlineHtml = convertJsonToHtml({ htmlJson: styledHtmlJson });

	return inlineHtml;
}

on("ready", () => {
	console.log("Running preview...");
	outerInlineHtml = runPreview();

	const filename = "./_inline-html.html";
	const content = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview Inline Styled HTML</title>
</head>
<body>
${outerInlineHtml}
</body>
</html>`;

	// Write the file
	fs.writeFile(filename, content, (err) => {
		if (err) {
			console.error("Error creating file:", err);
		} else {
			console.log(`File created successfully: ${filename}`);
		}
	});
});
