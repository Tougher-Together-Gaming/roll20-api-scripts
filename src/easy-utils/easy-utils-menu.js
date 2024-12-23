/*!
@language: en-US
@title: easy-menu.js
@description: The EASY_MENU module integrates with EASY_UTILS to provide a menu-driven interface and 
	control commands in the Roll20 environment. It uses factories (Phrase, Template, Theme) from the forge,
	parses user chat commands, and renders styled alerts to players via whisper messages.
@version: 1.0.0
@author: Mhykiel
@license: MIT
@repository: {@link https://github.com/Tougher-Together-Gaming/default-game-assets/tree/main/api-scripts/easy-lib-utility|GitHub Repository}
*/

// eslint-disable-next-line no-unused-vars
const EASY_MENU = (() => {

	/*******************************************************************************************************************
	 * SECTION: MODULE CONFIGURATION
	 *
	 * Here we define configuration and state related to EASY_MENU itself. The `moduleSettings` object is passed 
	 * to utility functions so they can behave according to the EASY_MENU module's preferences (e.g., verbose logging).
	 ******************************************************************************************************************/

	// TODO Fill out module meta data
	const moduleSettings = {
		readableName: "Easy-Menu",
		chatApiName: "ezmenu",
		globalName: "EASY_MENU",
		version: "1.0.0",
		author: "Mhykiel",
		verbose: true,
	};

	let Utils = {};
	let PhraseFactory = {};
	let TemplateFactory = {};
	let ThemeFactory = {};

	// TODO Add universal style colors
	// NOTE I suggest in the the CSS that you use a consistent schema for color variable names. This makes it
	// easy to have a consistent color schema across all modals (chat menus and stuff). Just put your style here
	// and pass this same object into all theme requests.

	const paletteColors = {
		"--ez-primary-color": "#8655B6",
		"--ez-secondary-color": "#17AEE8",
		"--ez-tertiary-color": "#34627B",
		"--ez-accent-color": "#CC6699",
		"--ez-complement-color": "#FCEC52",
		"--ez-contrast-color": "#C3B9C8",
		"--ez-primary-background-color": "#252B2C",
		"--ez-secondary-background-color": "#3F3F3F",
		"--ez-subdued-background-color": "#f2f2f2",
		"--ez-text-color": "#000000",
		"--ez-overlay-text-color": "#ffffff",
		"--ez-border-color": "#000000",
		"--ez-shadow-color": "#4d4d4d",
	};

	// !SECTION END of MODULE CONFIGURATION

	/*******************************************************************************************************************
	 * SECTION: MODULE FUNCTIONS
	 * ****************************************************************************************************************/

	// ANCHOR processMenuAsync
	const processMenuAsync = async (msgDetails) => {

		/*
		<div class="menu-box">
			<h3>{{ title }}</h3>
			<ul>
				<!-- <li><a href="!api --menu">Option 1</a></li> -->
				{{ menuItems }}
			</ul>
			<p class="menu-footer">{{ footer }}</p>
		</div>
		*/

		const moduleState = Utils.getSharedVault();
		const title = PhraseFactory.get({ playerId: msgDetails.senderId, transUnitId: "0x03BDB2A5" });

		log("processMenu ;; playerId: " + msgDetails.senderId);

		// NOTE use the '\' to escape, make literal, the special characters like the backtick (`) and exclamation (!)
		const menuItemsArray = [
			`<li><a href="\`!${moduleSettings.chatApiName} --set-lang">${PhraseFactory.get({ playerId: msgDetails.senderId, transUnitId: "0x08161075" })}</a></li>`,
			`<li role="deletion"><a href="\`!${moduleSettings.chatApiName} --purge-state all">${PhraseFactory.get({ playerId: msgDetails.senderId, transUnitId: "0x0DD74385" })}</a></li>`,
			`<li role="deletion"><a href="\`!${moduleSettings.chatApiName} --purge-state ${moduleState}">${PhraseFactory.get({ playerId: msgDetails.senderId, transUnitId: "0x0009ADA5" })}</a></li>`,
			`<li><a href="\`!${moduleSettings.chatApiName} --alerts">${PhraseFactory.get({ playerId: msgDetails.senderId, transUnitId: "0x0D842F34" })}</a></li>`,
			`<li><a href="\`!${moduleSettings.chatApiName} --command">${PhraseFactory.get({ playerId: msgDetails.senderId, transUnitId: "0x00402884" })}</a></li>`,
			`<li id="token"><a href="\`!${moduleSettings.chatApiName} --flip">${PhraseFactory.get({ playerId: msgDetails.senderId, transUnitId: "0x0382B96E" })}</a></li>`
		];
		
		// Join them with a newline
		const menuItemsHTML = menuItemsArray
			.join("\n");

		const footer = "";

		const menuContent = {
			title,
			menuItems: menuItemsHTML,
			footer,
		};

		try {
			const styledMessage = await Utils.renderTemplateAsync({
				template: "utilsMenu",
				expressions: menuContent,
				theme: "utilsMenu",
				cssVars: paletteColors,
			});

			const whisperArguments = {
				from: moduleSettings.readableName,
				to: msgDetails.senderName,
				message: styledMessage
			};
			Utils.whisperPlayerMessage(whisperArguments);

			return 0;
		} catch (err) {
			throw new Error(`${err}`);
		}
	};

	// ANCHOR processSetLanguageAsync
	const processSetLanguageAsync = async (msgDetails, parsedArgs) => {

		const _isEmptyObject = (obj) => {
			return JSON.stringify(obj) === "{}";
		};

		if (_isEmptyObject(parsedArgs)) {

			const title = PhraseFactory.get({ playerId: msgDetails.senderId, transUnitId: "0x03BDB2A5" });
			const availableLanguagesArray = PhraseFactory.getLanguages();
			
			const menuItemsArray = availableLanguagesArray.map(aLang => {
				return `<li><a href="\`!${moduleSettings.chatApiName} --set-lang ${aLang}">${aLang}</a></li>`;
			});
			
			// Join them with a newline
			const menuItemsHTML = menuItemsArray
				.join("\n");
	
			const footer = "";
	
			const menuContent = {
				title,
				menuItems: menuItemsHTML,
				footer,
			};
	
			try {
				const styledMessage = await Utils.renderTemplateAsync({
					template: "utilsMenu",
					expressions: menuContent,
					theme: "utilsMenu",
					cssVars: paletteColors,
				});
	
				const whisperArguments = {
					from: moduleSettings.readableName,
					to: msgDetails.senderName,
					message: styledMessage
				};
				Utils.whisperPlayerMessage(whisperArguments);
	
				return 0;
			} catch (err) {
				throw new Error(`${err}`);
			}
		}
		else {

			const selectedLang = Object.keys(parsedArgs)[0];
			PhraseFactory.setLanguage({ playerId: msgDetails.senderId, language: selectedLang });

			// whisperAlertMessageAsync({ from, to, severity = 4, apiCallContent, remark })
			const whisperArguments = {
				from: moduleSettings.readableName,
				to: msgDetails.senderName,
				toId: msgDetails.senderId,
				severity: 6, // INFORMATION
				apiCallContent: msgDetails.raw.content,
				remark: `${PhraseFactory.get({ playerId: msgDetails.senderId, transUnitId: "0x062D88F0", expressions: {remark: selectedLang} })}`
			};

			Utils.whisperAlertMessageAsync( whisperArguments );
		}
	};

	// ANCHOR processPurgeSate
	const processPurgeSate = () => {


	};

	// ANCHOR processExampleAlerts
	const processExampleAlerts = (msgDetails) => {

		let whisperArguments = {};

		// whisperAlertMessageAsync({ from, to, severity = 4, apiCallContent, remark })
		whisperArguments = {
			from: moduleSettings.readableName,
			to: msgDetails.senderName,
			toId: msgDetails.senderId,
			severity: 3, // ERROR
			apiCallContent: msgDetails.raw.content,
			remark: `${PhraseFactory.get({ playerId: msgDetails.senderId, transUnitId: "0x07845DCE" })}`
		};

		Utils.whisperAlertMessageAsync( whisperArguments );

		// whisperAlertMessageAsync({ from, to, severity = 4, apiCallContent, remark })
		whisperArguments = {
			from: moduleSettings.readableName,
			to: msgDetails.senderName,
			toId: msgDetails.senderId,
			severity: 4, // WARNING
			apiCallContent: msgDetails.raw.content,
			remark: `${PhraseFactory.get({ playerId: msgDetails.senderId, transUnitId: "0x06F2AA1E" })}`
		};
			
		Utils.whisperAlertMessageAsync( whisperArguments );

		// whisperAlertMessageAsync({ from, to, severity = 4, apiCallContent, remark })
		whisperArguments = {
			from: moduleSettings.readableName,
			to: msgDetails.senderName,
			toId: msgDetails.senderId,
			severity: 6, // INFORMATION
			apiCallContent: msgDetails.raw.content,
			remark: `${PhraseFactory.get({ playerId: msgDetails.senderId, transUnitId: "0x0512C293" })}`
		};

		Utils.whisperAlertMessageAsync( whisperArguments );

		// whisperAlertMessageAsync({ from, to, severity = 4, apiCallContent, remark })
		whisperArguments = {
			from: moduleSettings.readableName,
			to: msgDetails.senderName,
			toId: msgDetails.senderId,
			severity: 7, // TIP
			apiCallContent: msgDetails.raw.content,
			remark: `${PhraseFactory.get({ playerId: msgDetails.senderId, transUnitId: "0x061115DE" })}`
		};
			
		Utils.whisperAlertMessageAsync( whisperArguments );
	};

	// ANCHOR processCommand
	const processCommand = () => {

	};

	// ANCHOR processFlipTokens
	const processFlipTokens = () => {

	};

	// !SECTION END of Module Functions

	/*******************************************************************************************************************
	 * SECTION: EVENT HANDLERS
	 * ****************************************************************************************************************/

	// ANCHOR actionMap
	const actionMap = {
		// 	whisperAlertMessageAsync({ from, to, severity = 6, apiCallContent, remark })
		"--menu": (msgDetails, parsedArgs) => {return processMenuAsync(msgDetails);},
		"--set-lang": (msgDetails, parsedArgs) => {return processSetLanguageAsync(msgDetails, parsedArgs);},
		"--purge-state": (msgDetails, parsedArgs) => {return processPurgeSate(msgDetails, parsedArgs);},
		"--alerts": (msgDetails) => {return processExampleAlerts(msgDetails);},
		"--command": (msgDetails, parsedArgs) => {return processCommand(msgDetails);},
		"--flip": (msgDetails, parsedArgs) => {return processFlipTokens(msgDetails);},
		"--inline": (msgDetails) => {Utils.whisperPlayerMessage({ from: "System", to: "gm", message: JSON.stringify(msgDetails.raw) });}
	};

	const handleChatMessages = (apiCall) => {

		/* NOTE: If the message originates from a player, `thisPlayerId` will store the corresponding player object. 
		This can be used for actions like retrieving the player's name or sending them a whisper. 
		If the message does not come from a player (e.g., it comes from an API script), `thisPlayerId` will be set to `null`. 
		If a function needs the playerId it should check for its existence or provide a default.
		*/
		const thisPlayerObj = apiCall.playerid ? getObj("player", apiCall.playerid) : null;
		const thisPlayerName = thisPlayerObj ? thisPlayerObj.get("_displayname") : "Unknown Player";
		const thisPlayerIsGm = thisPlayerObj && playerIsGM(apiCall.playerid) ? true : false;
	
		const msgDetails = {
			raw: apiCall,
			commandMap: Utils.parseChatCommands({
				apiCallContent: apiCall.content,
			}),
			isGm: thisPlayerIsGm,
			senderId: thisPlayerObj.get("_id"),
			senderName: thisPlayerName.replace(/\(GM\)/g, "").trim(),
		};

		// Check if --ids is provided
		if (!msgDetails.commandMap.has("--ids")) {
			if (!apiCall.selected || apiCall.selected.length === 0) {
				// No --ids and no tokens selected error
				
				/* If a all functions need selected tokens or ids alert the user.
				const msgId = "0x0D9A441E";
				Utils.logSyslogMessage({
					severity: 6,
					tag: "checkInstall",
					transUnitId: msgId,
					message: PhraseFactory.get({transUnitId: msgId})
				});
				return 1;
				*/

				msgDetails.selectedIdsArray = [];

			} else {

				// --ids not provided. Use selected token IDs
				const selectedIdsArray = apiCall.selected.map(aSelection => {return aSelection._id;});
				msgDetails.selectedIdsArray = selectedIdsArray;
			}

		} else {

			// --ids was provided use those for the selected tokens, and remove the command from further parsing.
			msgDetails.selectedIdsArray = msgDetails.commandMap.get("--ids");
			msgDetails.commandMap.delete("--ids");
		}
	
		// Check if command exists in the methodMap and execute the corresponding action
		// Separate valid and invalid commands
		const validCommands = [];
		const invalidCommands = [];

		// Categorize commands as valid or invalid
		msgDetails.commandMap.forEach((args, aCommandName) => {
			if (actionMap.hasOwnProperty(aCommandName)) {
				validCommands.push({ aCommandName, args });
			} else {
				invalidCommands.push(aCommandName);
			}
		});

		// Check if both arrays are empty and default to calling the menu action
		if (validCommands.length === 0 && invalidCommands.length === 0) {
			
			// Default to menu if no command is provided
			actionMap["--menu"](msgDetails, {});
		} else {
			// Execute valid commands
			validCommands.forEach(({ aCommandName, args }) => {
				const parsedArgs = Utils.parseChatSubcommands({ subcommands: args });
				actionMap[aCommandName](msgDetails, parsedArgs);
			});

			// Handle invalid commands
			if (invalidCommands.length > 0) {
				let whisperArguments = {};

				// whisperAlertMessageAsync({ from, to, severity = 4, apiCallContent, remark })
				whisperArguments = {
					from: moduleSettings.readableName,
					to: msgDetails.senderName,
					toId: msgDetails.senderId,
					severity: 3, // ERROR
					apiCallContent: msgDetails.raw.content,
					remark: `${PhraseFactory.get({ transUnitId: "0x03B6FF6E" })}`
				};
	
				Utils.whisperAlertMessageAsync( whisperArguments );
			}
		}
	};
	// !SECTION END of Event Handlers

	/*******************************************************************************************************************
	 * SECTION: INITIALIZATION
	 ******************************************************************************************************************/

	// ANCHOR Function: registerEventHandlers
	const registerEventHandlers = () => {
		on("chat:message", (apiCall) => {
			if (apiCall.type === "api" && apiCall.content.startsWith(`!${moduleSettings.chatApiName}`)) {
				handleChatMessages(apiCall);
			}
		});

		return 0;
	};

	// ANCHOR Function: checkInstall
	const checkInstall = () => {

		if (typeof EASY_UTILS !== "undefined") {

			/*
			"applyCssToHtmlJson",
			"convertCssToJson",
			"convertHtmlToJson",
			"convertJsonToHtml",
			"convertToSingleLine",
			"createPhraseFactory",
			"createTemplateFactory",
			"createThemeFactory",
			"decodeNoteContent",
			"encodeNoteContent",
			"getGlobalSettings",
			"getSharedForge",
			"getSharedVault",
			"logSyslogMessage",
			"parseChatCommands",
			"parseChatSubcommands",
			"renderTemplateAsync",
			"replacePlaceholders",
			"whisperAlertMessageAsync",
			"whisperPlayerMessage"
			*/

			// TODO Limit the functions fetched down to the ones this module uses for memory efficiency.
			const requiredFunctions = [
				"applyCssToHtmlJson",
				"convertCssToJson",
				"convertHtmlToJson",
				"convertJsonToHtml",
				"convertToSingleLine",
				"createPhraseFactory",
				"createTemplateFactory",
				"createThemeFactory",
				"decodeNoteContent",
				"encodeNoteContent",
				"getGlobalSettings",
				"getSharedForge",
				"getSharedVault",
				"logSyslogMessage",
				"parseChatCommands",
				"parseChatSubcommands",
				"renderTemplateAsync",
				"replacePlaceholders",
				"whisperAlertMessageAsync",
				"whisperPlayerMessage",
				// This function is not in EASY_UTILS; when trying to retrieve it a warning will be logged.
				"badFunction"
			];

			Utils = EASY_UTILS.fetchUtilities({
				requiredFunctions,
				moduleSettings
			});

			// Get reference to and assign factories
			const easySharedForge = Utils.getSharedForge();

			PhraseFactory = easySharedForge.getFactory({name: "PhraseFactory"});
			TemplateFactory = easySharedForge.getFactory({name: "TemplateFactory"});
			ThemeFactory = easySharedForge.getFactory({name: "ThemeFactory"});

			// Log the module is initializing.
			const msgId = "10000";
			Utils.logSyslogMessage({
				severity: 6,
				tag: "checkInstall",
				transUnitId: msgId,
				message: PhraseFactory.get({transUnitId: msgId})
			});

			// Continue with other Set Up Tasks.

			// TODO Add custom localization
			PhraseFactory.add({newMap: {
				enUS: {
					"0x03BDB2A5": "Custom Menu",
					"0x08161075": "Set Preferred Language",
					"0x062D88F0": "Whispers to you from 'EASY-MODULES' will be in {{ remark }} (if available). ",
					"0x0DD74385": "Purge ALL Game State",
					"0x0009ADA5": "Purge module Game State",
					"0x084D29DE": "The Roll20 API state.{{ remark }} was purged.",
					"0x0D842F34": "Example Alert Messages",
					"0x00402884": "Example Chat Command",
					"0x0382B96E": "Example Change Token(s)",
					"0x07845DCE": "This is an example error alert whispered to players.",
					"0x06F2AA1E": "Example warning, suggesting a possibly dangerous thing happened.",
					"0x0512C293": "This is an example information notification whispered to players",
					"0x061115DE": "An example tip or confirmation styled Notification.",
					"0x03B6FF6E": "Invalid Arguments: There is one or more commands unrecognized. Check the commands spelling and usage."
				},
				frFR: {
					"0x03BDB2A5": "Menu personnalisé",
					"0x08161075": "Définir la langue préférée",
					"0x062D88F0": "Les chuchotements de 'EASY-MODULES' vous parviendront en {{ remark }} (si disponible).",
					"0x0DD74385": "Purger TOUT l'état de la partie",
					"0x0009ADA5": "Purger l'état du module de la partie",
					"0x084D29DE": "L'état de l'API Roll20.{{ remark }} a été purgé.",
					"0x0D842F34": "Exemples de messages d'alerte",
					"0x00402884": "Exemple de commande de discussion",
					"0x0382B96E": "Exemple de modification de(s) jeton(s)",
					"0x07845DCE": "Ceci est un exemple d'alerte d'erreur chuchotée aux joueurs.",
					"0x06F2AA1E": "Exemple d'avertissement, suggérant un événement potentiellement dangereux.",
					"0x0512C293": "Ceci est un exemple de notification d'information chuchotée aux joueurs.",
					"0x061115DE": "Un exemple de notification de type conseil ou confirmation.",
					"0x03B6FF6E": "Arguments invalides : une ou plusieurs commandes ne sont pas reconnues. Vérifiez l'orthographe et l'utilisation des commandes."
				  }
			}});

			// TODO Add Templates
			// Convert HTML into JSON representation
			const menuHtml = `
<div class="menu-box">
	<h3>{{ title }}</h3>
	<ul>
		<!-- <li><a href="!api --menu">Option 1</a></li> -->
		{{ menuItems }}
	</ul>
	<p class="menu-footer">{{ footer }} + [[1d20]]</p>
</div>
			`;

			TemplateFactory.add({ newTemplates: {
				"utilsMenu": `${menuHtml}`
			}});

			// TODO Add Themes
			// Convert CSS into JSON representation
			const menuCss = `
:root {
  /* Palette Colors */
  --ez-primary-color: #8655B6; 
  --ez-secondary-color: #17AEE8; 
  --ez-primary-background-color: #252B2C; 
  --ez-subdued-background-color: #F2F2F2; 
  --ez-overlay-text-color: #ffffff; 
  --ez-border-color: #000000; 
}

/* Chat Menu CSS Rules */
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

li[role="deletion"] {
  background-color: red;
}

li:nth-child(even) {
  background-color: var(--ez-primary-color);
}

#token {
  background-color: green;
}

/* Strip styles from Anchor tags (<a>) */
li > a {
    text-decoration: none;
    color: var(--ez-overlay-text-color);
    font-weight: bold;
    font-size: inherit;
    font-family: inherit;
    cursor: pointer;
}

.menu-footer {
  color: var(--ez-subdued-background-color);
}

.inline-rolls {
color: black;
}
`;

			ThemeFactory.add({ newThemes: {
				"utilsMenu": `${menuCss}`
			}});

			return 0;
		} else {

			// EASY_UTILS is unavailable. In Roll20 scripts that are in the most left tab are loaded first into a global
			// sandbox; as if all the script are pasted into one.
			const _getSyslogTimestamp = () => { return new Date().toISOString(); };
			const logMessage = `<ERROR> ${_getSyslogTimestamp()} [${moduleSettings.readableName}](checkInstall): {"transUnitId": 50000, "message": "Not Found: EASY_UTILS is unavailable. Ensure it is loaded before this module in the API console."}`;
			log(logMessage);

			return 1;
		}
	};

	// !SECTION END of INITIALIZATION

	/*******************************************************************************************************************
	 * SECTION: ROLL20 STARTUP HOOK
	 ******************************************************************************************************************/

	on("ready", () => {
		const continueMod = checkInstall();
		if (continueMod === 0) {
			registerEventHandlers();
		}

		// Log the Module is now ready for use.
		const msgId = "20000";
		Utils.logSyslogMessage({
			severity: 6,
			tag: "registerEventHandlers",
			transUnitId: msgId,
			message: PhraseFactory.get({transUnitId: msgId})
		});

		const whisperArguments = {
			from: moduleSettings.readableName,
			to: "gm",
			message: PhraseFactory.get({transUnitId: "20000"})
		};
		Utils.whisperPlayerMessage(whisperArguments);


	});

	// !SECTION END of ROLL20 STARTUP HOOK

	/*******************************************************************************************************************
	 * SECTION: PUBLIC INTERFACE
	 ******************************************************************************************************************/

	return {};
	// !SECTION END of PUBLIC INTERFACE

})();