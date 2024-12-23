/*!
 * @language: en-US
 * @title: easy-utils.js
 * @description: Utility library for Easy Modules in Roll20. Provides reusable, memory-efficient functions to simplify module development and reduce boilerplate.
 * @comment: IDE: VsCode Extensions: CommentAnchors 
 * @author: Mhykiel
 * @version: 0.1.0
 * @license: MIT License
 * @repository: {@link https://github.com/Tougher-Together-Gaming/roll20-api-scripts/blob/main/src/easy-utils/easy-utils.js|GitHub Repository}
 */

// ANCHOR Object: EASY_MODULE_FORGE
/**
 * @summary A global registry for managing factories shared across all Easy Modules.
 * 
 * - **Purpose**:
 *   - Acts as a shared registry for storing and retrieving factories across Easy Modules.
 *   - Simplifies access to modular resources like HTML templates, CSS themes, and localization strings.
 * 
 * - **Execution**:
 *   - Uses a Immediately Invoked Function Expression (IIFE) to create a singleton instance.
 *   - The following EASY_UTILS will initialize the "Forge" with factories.
 * 
 * - **Design**:
 *   - Maintains a central registry of factories keyed by name.
 *   - Factories follow a standardized interface, including methods like `add`, `remove`, `set`, `get`, and `init`.
 *   - Designed for sharing complex, reusable objects between modules without duplication.
 */
const EASY_MODULE_FORGE = (() => {

	const factories = {};

	return {

		// ANCHOR Method: getFactory
		getFactory: ({ name }) => {
			if (!factories.hasOwnProperty(name)) {
				return null;
			}

			return factories[name];
		},

		// ANCHOR Method: setFactory
		setFactory: ({ name, factory }) => {
			factories[name] = factory;
		},

		// ANCHOR Method: getFactoryNames
		getFactoryNames: () => {
			return Object.keys(factories);
		}
	};
})();

// ANCHOR Object: EASY_UTILS
/**
 * @summary A utility library for Easy Modules in Roll20, providing reusable functions to simplify module development.
 * 
 * - **Purpose**:
 *   - Reduces repetitive coding by centralizing common tasks like CSS/HTML manipulation, logging, and messaging.
 *   - Provides tools to streamline creating, rendering, and managing templates and themes.
 * 
 * - **Execution**:
 *   - Must be uploaded as the first script (farthest left tab) in the Roll20 API sandbox to ensure availability for dependent modules.
 *   - Designed to work seamlessly with the `EASY_MODULE_FORGE` for managing shared factories.
 * 
 * - **Design**:
 *   - Functions use closures for memory efficiency and to customize per module.
 *   - Only required functions are loaded to save memory.
 *   - Functions use destructured parameters (objects) to ensure consistent interfaces.
 *   - Relies on a global object for factory functions and shared state.
 *   - Designed for CSS/HTML template tasks common in Roll20.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures
 * @see https://dev.to/ahmedgmurtaza/use-closures-for-memory-optimizations-in-javascript-a-case-study-43h9
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
 * @see https://www.geeksforgeeks.org/parameter-destructuring/
 * @see https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/What_is_CSS#how_is_css_applied_to_html
 */
// eslint-disable-next-line no-unused-vars
const EASY_UTILS = (() => {

	/*******************************************************************************************************************
	 * SECTION: Configuration and Settings
	 * 
	 * Centralized storage for shared settings and reusable data specific to this module.
	 * 
	 * - Serves as a single source of truth for values used across multiple functions.
	 * - Simplifies maintenance by allowing updates in one location to propagate throughout the module.
	 ******************************************************************************************************************/

	// ANCHOR Property: globalSettings
	// These values do not change when functions are loaded by other modules
	const globalSettings = {
		sharedVaultName: "EasyModuleVault",
		// FIXME If you change sharedForgeName you have to change the hardcoded name in getSharedForge()
		sharedForgeName: "EASY_MODULE_FORGE",
		defaultLanguage: "enUS",
	};

	// ANCHOR Property: moduleSettings
	const moduleSettings = {
		readableName: "Easy-Utils",
		chatApiName: "ezutils",
		globalName: "EASY_UTILS",
		version: "1.0.0",
		author: "Mhykiel",
		verbose: false,
	};

	// ANCHOR Property: factoryFunctions
	// Identify Factories for special handling by function Function Loader
	const factoryFunctions = [
		"createPhraseFactory",
		"createTemplateFactory",
		"createThemeFactory",
	];

	// These are reassigned during checkInstall to initialize Factories and provide basic syslog messages to EASY_UTILS.
	let Utils = {};
	let PhraseFactory = {};
	let TemplateFactory = {};
	let ThemeFactory = {};

	// !SECTION END of Configuration and Settings

	/**
	 * @namespace functionFunction Loaders
	 * 
	 * Utility functions for Roll20 modules, built with double closures for efficiency and flexibility.
	 * 
	 * - **Purpose**:
	 *   - Reduce memory usage by only instantiating functions when requested.
	 *   - Provide customized behavior for each module by wrapping functions with `moduleSettings`.
	 *   - Ensure consistency across modules with standardized implementations of routine functions.
	 * 
	 * - **Execution**:
	 * 
	 * @example
	 * // Retrieve a customized function instance:
	 * const customizedFunction = EASY_UTILS.GetFunction({ functionName: "functionName", moduleSettings });
	 * 
	 * - **Design**:
	 *   - The first closure caches dependencies and module-specific settings, while the second returns the customized function.
	 */
	const functionLoaders = {

		/***************************************************************************************************************
		 * SECTION: Available Functions: Low Level
		 * 
		 * Basic, reusable, and stateless functions for small, specific tasks. 
		 * 
		 * - Support higher-level functions but can be used independently.
		 * - Do not require `moduleSettings` but include it for consistency and optional logging.
		 * - Handle errors gracefully (e.g., return default values or log warnings) without throwing exceptions.
		 **************************************************************************************************************/

		// ANCHOR Function Loader: applyCssToHtmlJson
		/**
		 * @summary Applies CSS (provided as JSON) to an HTML-like structure (also provided as JSON).
		 * This function parses the CSS rules and HTML structure, merges styles (with respect to !important),
		 * handles pseudo-classes, attribute selectors, classes, IDs, and more, then returns a new HTML JSON
		 * structure that includes computed styles as if the HTML had in-line styles.
		 * 
		 * @see convertCssToJson
		 * @see convertHtmlToJson
		 */
		applyCssToHtmlJson: function () {
			return (moduleSettings) => {

				// Cache Dependencies
				const logSyslogMessage = EASY_UTILS.getFunction({ functionName: "logSyslogMessage", moduleSettings });

				return ({ cssJson, htmlJson }) => {
					try {

						/*******************************************************************************************************
						 * 1. Parse JSON inputs
						 ******************************************************************************************************/
						const cssData = (typeof cssJson === "string") ? JSON.parse(cssJson) : cssJson;
						const htmlData = (typeof htmlJson === "string") ? JSON.parse(htmlJson) : htmlJson;

						/*******************************************************************************************************
						 * 2. Gather :root CSS variables (those starting with "--")
						 ******************************************************************************************************/
						const cssRootVariables = Object.fromEntries(
							Object.entries(cssData.functions?.[":root"]?.style || {})
								.filter(([cssProp]) => { return cssProp.startsWith("--"); })
						);

						/*******************************************************************************************************
						 * Subroutine Function: Replaces any var(--someVar) string with the corresponding :root CSS variable.
						*******************************************************************************************************/
						function resolveRootVariables(rawCssValue) {
							if (typeof rawCssValue === "string") {
								return rawCssValue.replace(/var\((--[a-zA-Z0-9-]+)\)/g, (_, varName) => {

									// If we have a known root variable, substitute it; otherwise keep the reference as-is.
									return cssRootVariables[varName] || `var(${varName})`;
								});
							}

							// Graceful failover
							return rawCssValue;
						}

						/*******************************************************************************************************
						 * Subroutine Function: Merges new styles into the current styles, but respects !important by placing those
						*******************************************************************************************************/
						function overwriteStyles(newCssRule, existingCssStyle, inlineStyle = {}) {
							for (const [cssPropName, rawCssValue] of Object.entries(newCssRule)) {
								// Resolve var(--xyz) references first
								const resolvedCssValue = resolveRootVariables(rawCssValue);

								// If it includes !important, store it in inlineStyles
								if (
									typeof resolvedCssValue === "string" &&
									resolvedCssValue.includes("!important")
								) {
									inlineStyle[cssPropName] = resolvedCssValue.replace("!important", "").trim();
								}
								// Otherwise, place it into existingCssStyles (if not overridden by inline)
								else if (!(cssPropName in inlineStyle)) {
									existingCssStyle[cssPropName] = resolvedCssValue;
								}
							}

							// Graceful failover
							return existingCssStyle;
						}

						/*******************************************************************************************************
						 * Subroutine Function: Checks for attribute-based CSS selectors and merges styles if matched.
						*******************************************************************************************************/
						function applyAttributeSelectors(focusHtmlElement, focusHtmlProps, existingCssStyle) {

							// If there are no attribute-based rules, skip
							if (!cssData.attributes) {
								return existingCssStyle;
							}

							// Iterate each attribute selector in CSS (e.g., `[role="foo"]`, `div[role="foo"]`)
							for (const attributeSelector of Object.keys(cssData.attributes)) {
								const cssRuleObject = cssData.attributes[attributeSelector];

								// Try to parse something like `div[role="remedy"]` or `[hidden]`
								const match = attributeSelector.match(/^([a-zA-Z0-9]+)?\[([\w-]+)(?:=["']?(.*?)["']?)?\]$/);
								if (!match) continue;

								const targetHtmlElement = match[1]; // e.g., "div"
								const targetHtmlAttrName = match[2]; // e.g., "role"
								const targetHtmlAttrValue = match[3]; // e.g., "remedy"

								// If this selector includes a specific element, check if we match
								if (targetHtmlElement && focusHtmlElement !== targetHtmlElement) {
									continue;
								}

								// If the focus node doesn’t have the required attribute, skip
								if (!(targetHtmlAttrName in focusHtmlProps)) {
									continue;
								}

								// If the attribute had a required value, verify it matches
								if (targetHtmlAttrValue && focusHtmlProps[targetHtmlAttrName] !== targetHtmlAttrValue) {
									continue;
								}

								// If we match, apply the CSS rule
								const attributeCssStyles = cssRuleObject.style || {};
								overwriteStyles(attributeCssStyles, existingCssStyle, focusHtmlProps.inlineStyle);
							}

							// Graceful failover
							return existingCssStyle;
						}

						/*******************************************************************************************************
						 * Subroutine Function: Applies pseudo class rules such as <element>:nth-child(even), <element>:first-child, etc.
						*******************************************************************************************************/
						function applyElementPseudoSelectors(focusHtmlNode, parentHtmlNode, existingCssStyle) {
							// If we have no function/pseudo selectors, skip
							if (!cssData.functions) {
								return existingCssStyle;
							}

							const focusHtmlElement = focusHtmlNode.element;
							const focusHtmlProps = focusHtmlNode.props;
							const { childIndex, children } = focusHtmlNode;

							// Loop over each pseudo-like selector in cssData.functions
							for (const [cssSelector, cssRuleObject] of Object.entries(cssData.functions)) {

								// Skip :root (already handled)
								if (cssSelector === ":root") {
									continue;
								}

								// Attempt to match forms like "div:nth-child(even)" or "p:first-child"
								const match = cssSelector.match(/^([a-zA-Z0-9]+)?(:[a-zA-Z-]+(?:\([^)]+\))?)$/);
								if (!match) continue;

								const targetHtmlElement = match[1] || "*"; // default to universal
								const pseudoPart = match[2];

								// If the focus node’s element doesn’t match the target (and it’s not "*"), skip
								if (focusHtmlElement !== targetHtmlElement && targetHtmlElement !== "*") {
									continue;
								}

								const pseudoClassStyles = cssRuleObject.style;

								// Evaluate the pseudo-class
								switch (true) {
								//----------------------------------------------------------------
								// :nth-child(...)
								//----------------------------------------------------------------
								case /:nth-child\((.+)\)$/.test(pseudoPart): {
									const targetChildPosition = pseudoPart.match(/:nth-child\((.+)\)$/)?.[1]?.trim();
									if (!targetChildPosition || !childIndex) break;

									let shouldApply = false;
									switch (true) {
									case targetChildPosition === "even" && childIndex % 2 === 0:
										shouldApply = true;
										break;
									case targetChildPosition === "odd" && childIndex % 2 === 1:
										shouldApply = true;
										break;
									case !isNaN(Number(targetChildPosition)) && childIndex === Number(targetChildPosition):
										shouldApply = true;
										break;

										// TODO Add more logic for (An+B) and other patterns

										// Default: No match
									default:
										shouldApply = false;
										break;
									}

									if (shouldApply) {
										overwriteStyles(pseudoClassStyles || {}, existingCssStyle, focusHtmlProps.inlineStyle);
									}
									break;
								}

								//----------------------------------------------------------------
								// :first-child
								//----------------------------------------------------------------
								case pseudoPart === ":first-child": {
									if (parentHtmlNode && childIndex === 1) {
										overwriteStyles(pseudoClassStyles || {}, existingCssStyle, focusHtmlProps.inlineStyle);
									}
									break;
								}

								//----------------------------------------------------------------
								// :last-child
								//----------------------------------------------------------------
								case pseudoPart === ":last-child": {
									if (
										parentHtmlNode &&
											parentHtmlNode.children &&
											parentHtmlNode.children.length === childIndex
									) {
										overwriteStyles(pseudoClassStyles || {}, existingCssStyle, focusHtmlProps.inlineStyle);
									}
									break;
								}

								//----------------------------------------------------------------
								// :empty
								//----------------------------------------------------------------
								case pseudoPart === ":empty": {
									if (!children || children.length === 0) {
										overwriteStyles(pseudoClassStyles || {}, existingCssStyle, focusHtmlProps.inlineStyle);
									}
									break;
								}

								// TODO Add more pseudo-classes as needed...
								default:
									break;
								}
							}

							// Graceful failover
							return existingCssStyle;
						}

						/*******************************************************************************************************
						 * Main Function: Determines the final style object for a single (focus) HTML node, accounting for:
						 *   - universal selectors (*)
						 *   - element-based selectors (e.g. `div`, `p`)
						 *   - parent > child combinations (e.g. `div > p`)
						 *   - pseudo-classes (:nth-child, :empty, etc.)
						 *   - classes (.someClass)
						 *   - attributes ([role="banner"])
						 *   - IDs (#myElement)
						 ******************************************************************************************************/
						function getStylesForElement(
							focusHtmlElement,
							focusHtmlProps,
							focusHtmlNode,
							parentHtmlNode,
							cssData
						) {
							const existingCssStyle = {};

							//----------------------------------------------------------------
							// Universal "*"
							//----------------------------------------------------------------
							if (cssData.universal) {
								overwriteStyles(cssData.universal, existingCssStyle, focusHtmlProps.inlineStyle);
							}

							//----------------------------------------------------------------
							// Element-based selectors (e.g. cssData.elements.div)
							//----------------------------------------------------------------
							if (cssData.elements && cssData.elements[focusHtmlElement]) {
								const elemObj = cssData.elements[focusHtmlElement];
								overwriteStyles(elemObj.style || {}, existingCssStyle, focusHtmlProps.inlineStyle);
							}

							//----------------------------------------------------------------
							// Parent > child styles (e.g. `div > p`)
							//----------------------------------------------------------------
							if (
								parentHtmlNode &&
								cssData.elements?.[parentHtmlNode.element]?.children?.[focusHtmlElement]?.style
							) {
								const childStyles = cssData.elements[parentHtmlNode.element].children[focusHtmlElement].style;
								overwriteStyles(childStyles, existingCssStyle, focusHtmlProps.inlineStyle);
							}

							//----------------------------------------------------------------
							// Pseudo-classes (e.g. :nth-child)
							//----------------------------------------------------------------
							applyElementPseudoSelectors(focusHtmlNode, parentHtmlNode, existingCssStyle);

							//----------------------------------------------------------------
							// Classes
							//----------------------------------------------------------------
							const focusHtmlClassList = focusHtmlProps.class || [];
							focusHtmlClassList.forEach((className) => {
								const classKey = `.${className}`;
								if (cssData.classes && cssData.classes[classKey]) {
									overwriteStyles(
										cssData.classes[classKey].style || {},
										existingCssStyle,
										focusHtmlProps.inlineStyle
									);
								}
							});

							//----------------------------------------------------------------
							// Attribute selectors
							//----------------------------------------------------------------
							applyAttributeSelectors(focusHtmlElement, focusHtmlProps, existingCssStyle);

							//----------------------------------------------------------------
							// IDs
							//----------------------------------------------------------------
							if (focusHtmlProps.id) {
								const focusHtmlIdKey = `#${focusHtmlProps.id}`;
								if (cssData.ids && cssData.ids[focusHtmlIdKey]) {
									overwriteStyles(
										cssData.ids[focusHtmlIdKey].style || {},
										existingCssStyle,
										focusHtmlProps.inlineStyle
									);
								}
							}

							return existingCssStyle;
						}

						/*******************************************************************************************************
						 * Subroutine Function: Recursively walks the HTML structure, computing styles for each node and attaching them.
						 ******************************************************************************************************/
						function applyStylesRecursively(focusHtmlNodeOrArray, parentHtmlNode, cssData) {

							// If we have an array, process each child
							if (Array.isArray(focusHtmlNodeOrArray)) {
								focusHtmlNodeOrArray.forEach((childNode) => {
									applyStylesRecursively(childNode, parentHtmlNode, cssData);
								});
							}

							// If it’s an actual node object
							else if (focusHtmlNodeOrArray && typeof focusHtmlNodeOrArray === "object") {
								const focusHtmlElement = focusHtmlNodeOrArray.element;
								const focusHtmlProps = focusHtmlNodeOrArray.props || {};

								// Ensure inlineStyles is defined so we don’t get undefined errors
								focusHtmlProps.inlineStyle = focusHtmlProps.inlineStyle || {};

								// Compute final styles for this node
								const computedStyle = getStylesForElement(
									focusHtmlElement,
									focusHtmlProps,
									focusHtmlNodeOrArray,
									parentHtmlNode,
									cssData
								);

								// Attach them
								focusHtmlProps.style = { ...computedStyle };

								// Recurse into children
								const children = focusHtmlNodeOrArray.children || [];
								applyStylesRecursively(children, focusHtmlNodeOrArray, cssData);
							}
						}

						/*******************************************************************************************************
						 * 3. Walk & apply styles to the entire HTML tree
						 ******************************************************************************************************/
						applyStylesRecursively(htmlData, null, cssData);


						/*******************************************************************************************************
						 * 4. Generate JSON output
						 ******************************************************************************************************/
						const output = JSON.stringify(htmlData, null, 2);

						// If verbose, log at DEBUG level
						if (moduleSettings.verbose) {
							logSyslogMessage({
								severity: 7, // DEBUG
								tag: "applyCssToHtmlJson",
								transUnitId: "70000",
								message: output
							});
						}

						// Return final HTML with computed styles
						return output;

					} catch (err) {
						// In case of error, log at ERROR level
						logSyslogMessage({
							severity: 3, // ERROR
							tag: "applyCssToHtmlJson",
							transUnitId: "30000",
							message: `${err}`
						});

						// Graceful failover: return unmodified HTML
						return htmlJson;
					}
				};
			};
		},

		// ANCHOR Function Loader: convertCssToJson
		/**
		 * @summary Convert CSS string into JSON rules.
		 * @example
		 * const cssJsonStr = convertCssToJson()({ css: "div { color: red; }" });
		 * log(cssJsonStr); // JSON representation of CSS rules
		 */
		convertCssToJson: function () {
			return (moduleSettings) => {

				// Cache Dependencies
				const logSyslogMessage = EASY_UTILS.getFunction({ functionName: "logSyslogMessage", moduleSettings });

				return ({ css }) => {
					try {
						/*******************************************************************************************************
						 * 1. Clean up the raw CSS
						 ******************************************************************************************************/
						const cleanedCss = css
							.replace(/\/\*[\s\S]*?\*\//g, "") // Remove block comments
							.replace(/\n/g, " ")             // Replace newlines with spaces
							.replace(/\s+/g, " ")            // Collapse multiple spaces
							.trim();                         // Remove leading/trailing spaces

						/*******************************************************************************************************
						 * 2. Prepare data structure for storing rules
						 ******************************************************************************************************/
						const cssData = {
							universal: {},
							elements: {},
							classes: {},
							attributes: {},
							ids: {},
							functions: {},
						};

						/*******************************************************************************************************
						 * 3. Define regex patterns to capture selectors and their style blocks
						 ******************************************************************************************************/
						const ruleRegex = /([^\{]+)\{([^\}]+)\}/g;
						const propertiesRegex = /([\w-]+)\s*:\s*([^;]+);/g;

						/*******************************************************************************************************
						 * 4. Iterate over each CSS rule block
						 ******************************************************************************************************/
						let ruleMatch;
						while ((ruleMatch = ruleRegex.exec(cleanedCss))) {
							const selectorsRaw = ruleMatch[1].trim();       // e.g. "div, p:hover, .myClass"
							const propertiesRaw = ruleMatch[2].trim();      // e.g. "color: red; background: blue;"

							// Parse the style properties into an object
							const styleObj = {};
							let propMatch;
							while ((propMatch = propertiesRegex.exec(propertiesRaw))) {
								const propKey = propMatch[1].trim();
								const propValue = propMatch[2].trim();
								styleObj[propKey] = propValue;
							}

							/*****************************************************************************************************
							 * 4a. Split group selectors (e.g., "div, p" => ["div", "p"])
							 *****************************************************************************************************/
							selectorsRaw
								.split(",")
								.map(sel => { return sel.trim(); })
								.forEach((aSelector) => {
									switch (true) {

									//----------------------------------------------------------------
									// Universal (*)
									//----------------------------------------------------------------
									case aSelector === "*":
										Object.assign(cssData.universal, styleObj);
										break;

										//----------------------------------------------------------------
										// Class selectors (e.g. ".my-class")
										//----------------------------------------------------------------
									case aSelector.startsWith("."):
										if (!cssData.classes[aSelector]) {
											cssData.classes[aSelector] = { style: {}, children: {} };
										}
										Object.assign(cssData.classes[aSelector].style, styleObj);
										break;

										//----------------------------------------------------------------
										// ID selectors (e.g. "#my-id")
										//----------------------------------------------------------------
									case aSelector.startsWith("#"):
										if (!cssData.ids[aSelector]) {
											cssData.ids[aSelector] = { style: {}, children: {} };
										}
										Object.assign(cssData.ids[aSelector].style, styleObj);
										break;

										//----------------------------------------------------------------
										// Attribute selectors (e.g. [role="foo"], div[role="foo"])
										//----------------------------------------------------------------
									case /^([a-zA-Z0-9]+)?\[[^\]]+\]$/.test(aSelector):
										if (!cssData.attributes[aSelector]) {
											cssData.attributes[aSelector] = { style: {}, children: {} };
										}
										Object.assign(cssData.attributes[aSelector].style, styleObj);
										break;

										//----------------------------------------------------------------
										// Pseudo-classes / pseudo-elements (e.g. :hover, :root, :nth-child)
										//----------------------------------------------------------------
									case aSelector.includes(":"):
										if (!cssData.functions[aSelector]) {
											cssData.functions[aSelector] = { style: {} };
										}
										Object.assign(cssData.functions[aSelector].style, styleObj);
										break;

										//----------------------------------------------------------------
										// Child selectors (e.g. div > p, .parent > .child)
										//----------------------------------------------------------------
									case aSelector.includes(">"): {
										const parts = aSelector.split(">").map(s => { return s.trim(); });
										// Start at elements as the base
										let currentLevel = cssData.elements;

										parts.forEach((part, index) => {
											if (!currentLevel[part]) {
												currentLevel[part] = { style: {}, children: {} };
											}
											if (index === parts.length - 1) {
												// Last part => assign the style
												Object.assign(currentLevel[part].style, styleObj);
											} else {
												// Descend into children
												currentLevel = currentLevel[part].children;
											}
										});
										break;
									}

									//----------------------------------------------------------------
									// Default => treat as a normal HTML element (e.g. "div", "p")
									//----------------------------------------------------------------
									default:
										if (!cssData.elements[aSelector]) {
											cssData.elements[aSelector] = { style: {}, children: {} };
										}
										Object.assign(cssData.elements[aSelector].style, styleObj);
										break;
									}
								});
						}

						/*******************************************************************************************************
						 * 5. Produce the JSON output
						 ******************************************************************************************************/
						const output = JSON.stringify(cssData, null, 2);

						// If verbose, log at DEBUG level
						if (moduleSettings.verbose) {
							logSyslogMessage({
								severity: 7, // DEBUG
								tag: "convertCssToJson",
								transUnitId: "70000",
								message: output
							});
						}

						// Return the final JSON string
						return output;

					} catch (err) {

						// In case of error, log at ERROR level
						logSyslogMessage({
							severity: 4, // WARNING
							tag: "convertCssToJson",
							transUnitId: "30000",
							message: `${err}`
						});

						// Return an empty fallback JSON
						const fallback = {
							universal: {},
							elements: {},
							classes: {},
							attributes: {},
							functions: {},
							ids: {}
						};

						return JSON.stringify(fallback);
					}
				};
			};
		},

		// ANCHOR Function Loader: convertHtmlToJson
		/**
		 * @summary Convert HTML string into an HTML JSON structure.
		 * @example
		 * const htmlJsonStr = convertHtmlToJson()({ html: "<div>Hello</div>" });
		 * log(htmlJsonStr); // JSON representation of the HTML structure
		 */
		convertHtmlToJson: function () {
			return (moduleSettings) => {

				// Cache Dependencies
				const logSyslogMessage = EASY_UTILS.getFunction({ functionName: "logSyslogMessage", moduleSettings });

				return ({ html: rawHtml }) => {
					try {
						/*******************************************************************************************************
						 * 1. Clean up the raw HTML
						 ******************************************************************************************************/
						const cleanedHtml = rawHtml
							.replace(/<!--[\s\S]*?-->/g, "") // Remove HTML comments
							.replace(/\n/g, " ")            // Replace newlines with spaces
							.replace(/\s+/g, " ")           // Collapse multiple spaces
							.trim();                        // Remove leading/trailing spaces

						/*******************************************************************************************************
						 * 2. Use a regex to split out tags vs. text nodes
						 ******************************************************************************************************/
						const tokenRegex = /<\/?\w+[^>]*>|[^<>]+/g;
						const rawTokens = cleanedHtml.match(tokenRegex) || [];
						const tokenArray = rawTokens
							.map(token => { return token.trim(); })
							.filter(Boolean);

						/*******************************************************************************************************
						 * Main Function: Builds a hierarchical JSON representation of the tokens, simulating a DOM tree.
						 ******************************************************************************************************/
						function parseHtmlToJson(tokens) {
							const stack = [];
							// We'll store everything under a "root" node with an array of children
							const rootNode = { children: [] };
							stack.push(rootNode);

							// Iterate all tokens
							tokens.forEach((token) => {
								// Opening tag <div>, <p>, <span>, etc. capturing attributes
								const openingTagMatch = token.match(/^<(\w+)([^>]*)>$/);
								// Closing tag </div>, </p>, etc.
								const closingTagMatch = token.match(/^<\/(\w+)>$/);

								if (openingTagMatch) {
									// Extract the element name (e.g. 'div') and the attributes raw string
									const [, tagName, rawAttributes] = openingTagMatch;

									// Initialize default props
									const focusHtmlProps = {
										style: {},
										class: [],
										id: null,
										inlineStyle: {}
									};

									// If we have attributes, parse them
									if (rawAttributes) {
										const attributeRegex = /([\w-]+)\s*=\s*["']([^"']+)["']/g;
										let attrMatch;
										while ((attrMatch = attributeRegex.exec(rawAttributes))) {
											const [, attrName, attrValue] = attrMatch;

											if (attrName === "style") {
												// Convert "color: red; margin: 10px" into an object
												const inlineStyleObj = {};
												attrValue.split(";").forEach((styleDecl) => {
													const [key, val] = styleDecl.split(":").map(s => { return s.trim(); });
													if (key && val) {
														inlineStyleObj[key] = val;
													}
												});
												focusHtmlProps.inlineStyle = inlineStyleObj;

											} else if (attrName === "class") {
												// Split on spaces for multiple classes
												focusHtmlProps.class = attrValue.split(" ").filter(Boolean);

											} else if (attrName === "id") {
												focusHtmlProps.id = attrValue;

											} else {
												// Any other attribute becomes a direct prop
												focusHtmlProps[attrName] = attrValue;
											}
										}
									}

									// Create a new node for this element
									const newNode = {
										element: tagName,
										props: focusHtmlProps,
										children: [],
										childIndex: 0
									};

									// Add as a child to the current top of stack
									const parent = stack[stack.length - 1];
									if (parent) {
										newNode.childIndex = parent.children.length + 1;
										parent.children.push(newNode);
									}

									// Push onto stack so subsequent tokens become its children
									stack.push(newNode);

								} else if (closingTagMatch) {
									// We found a closing tag, so pop the stack
									stack.pop();

								} else {
									// It's text content
									const trimmedText = token.trim();
									if (trimmedText) {
										const textNode = {
											element: "text",
											children: [{ innerText: trimmedText }],
											childIndex: 0
										};

										// Attach it to current top of stack
										const parent = stack[stack.length - 1];
										if (parent) {
											textNode.childIndex = parent.children.length + 1;
											parent.children.push(textNode);
										}
									}
								}
							});

							// If stack is not back to 1, HTML was malformed
							if (stack.length !== 1) {
								// Log an error about unclosed tags
								logSyslogMessage({
									severity: 3, // ERROR
									tag: "convertHtmlToJson",
									transUnitId: "50000",
									message: "Invalid Argument: Unclosed HTML tags detected. Ensure HTML is well-formed."
								});
							}

							// Return top-level children (skipping the artificial "root" node)
							return rootNode.children;
						}

						/*******************************************************************************************************
						 * 3. Parse the token array into a JSON structure
						 ******************************************************************************************************/
						const jsonStructure = parseHtmlToJson(tokenArray);

						/*******************************************************************************************************
						 * 4. Produce JSON output
						 ******************************************************************************************************/
						const output = JSON.stringify(jsonStructure, null, 2);

						// If verbose, log at DEBUG level
						if (moduleSettings.verbose) {
							logSyslogMessage({
								severity: 7, // DEBUG
								tag: "convertHtmlToJson",
								transUnitId: "70000",
								message: output
							});
						}

						// Return final JSON
						return output;

					} catch (err) {

						// In case of error, log at ERROR level
						logSyslogMessage({
							severity: 4, // WARNING
							tag: "convertHtmlToJson",
							transUnitId: "30000",
							message: `${err}`
						});

						// Return a fallback HTML JSON with an error message
						return JSON.stringify([
							{
								element: "div",
								props: {
									style: {},
									class: [],
									id: null,
									inlineStyle: {}
								},
								children: [
									{
										element: "h1",
										props: {
											style: {},
											class: [],
											id: null,
											inlineStyle: {}
										},
										children: [
											{
												element: "text",
												children: [{ innerText: "Input was Malformed HTML" }],
												childIndex: 1
											}
										],
										childIndex: 1
									}
								],
								childIndex: 1
							}
						]);
					}
				};
			};
		},

		// ANCHOR Function Loader: convertJsonToHtml
		/**
		 * @summary Convert an HTML JSON structure back into an HTML string.
		 * @example
		 * const htmlStr = convertJsonToHtml()({ htmlJson });
		 * log(htmlStr); // "<div>Hello</div>"
		 */
		convertJsonToHtml: function () {
			return (moduleSettings) => {

				// Cache Dependencies
				const logSyslogMessage = EASY_UTILS.getFunction({ functionName: "logSyslogMessage", moduleSettings });

				return ({ htmlJson }) => {
					try {

						/*******************************************************************************************************
						 * 1. Parse the incoming JSON
						 ******************************************************************************************************/
						const parsedJson = JSON.parse(htmlJson);

						/*******************************************************************************************************
						 * Subroutine Function: Converts a style object (e.g. { marginTop: "10px" }) into a valid CSS string ("margin-top: 10px;")
						 ******************************************************************************************************/
						function styleToString(styleObj) {
							return Object.entries(styleObj)
								.map(([key, value]) => {
									// Convert camelCase to kebab-case
									const kebabKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();

									return `${kebabKey}: ${value};`;
								})
								.join(" ");
						}

						/*******************************************************************************************************
						 * Main Function: Recursively transforms a single node (in JSON) into its corresponding HTML string.
						 ******************************************************************************************************/
						function processNode(node) {
							// If there's no recognized element, return empty
							if (!node.element) {
								return "";
							}

							// If it’s a text node, return the text content directly
							if (node.element === "text") {
								return node.children && node.children[0]?.innerText
									? node.children[0].innerText
									: "";
							}

							// Combine style and inlineStyle to produce final style string
							const combinedStyle = {
								...node.props?.style,
								...node.props?.inlineStyle
							};
							const styleString = styleToString(combinedStyle);

							// Build the HTML attributes
							const attributes = [];
							if (styleString) {
								attributes.push(`style="${styleString}"`);
							}
							if (node.props?.class?.length) {
								attributes.push(`class="${node.props.class.join(" ")}"`);
							}
							if (node.props?.id) {
								attributes.push(`id="${node.props.id}"`);
							}

							// Add any other props (e.g. data- attributes, custom attributes)
							Object.keys(node.props || {})
								.filter((key) => { return !["style", "inlineStyle", "class", "id"].includes(key); })
								.forEach((key) => {
									attributes.push(`${key}="${node.props[key]}"`);
								});

							// Recursively process children
							const childrenHtml = (node.children || [])
								.map(processNode)
								.join("");

							// Return the final HTML string for this node
							return `<${node.element} ${attributes.join(" ")}>${childrenHtml}</${node.element}>`;
						}

						/*******************************************************************************************************
						 * 2. Map through the root-level JSON (array or single node) and build the final HTML string
						 ******************************************************************************************************/
						let output = "";

						if (Array.isArray(parsedJson)) {
							// If it’s an array of nodes, process each
							output = parsedJson.map(processNode).join("");
						} else {
							// If it’s a single node/object, process once
							output = processNode(parsedJson);
						}

						// If verbose, log at DEBUG level
						if (moduleSettings.verbose) {
							logSyslogMessage({
								severity: 7, // DEBUG
								tag: "convertJsonToHtml",
								transUnitId: "70000",
								message: output
							});
						}

						// Return the final HTML string
						return output;

					} catch (err) {

						// In case of error, log at ERROR level
						logSyslogMessage({
							severity: 3, // ERROR
							tag: "convertJsonToHtml",
							transUnitId: "30000",
							message: `${err}`
						});

						// Provide a fallback HTML string
						return "<div><h1>Error transforming HTML JSON representation</h1></div>";
					}
				};
			};
		},


		// ANCHOR Function Loader: convertToSingleLine
		/**
		 * @summary Convert multiline text into a single line, preserving quoted text.
		 * @example
		 * const singleLine = convertToSingleLine()({ multiline: "Hello\n  World" });
		 * log(singleLine); // "Hello World"
		 */
		convertToSingleLine: function () {
			// eslint-disable-next-line no-unused-vars
			return (moduleSettings) => {
				return ({ multiline }) => {
					const regex = /("[^"]*"|'[^']*')|\s+/g;

					return multiline.replace(regex, (_, quoted) => { return quoted ? quoted : " "; });
				};
			};
		},

		// ANCHOR Function: createPhraseFactory
		/**
		 * @summary Create and manage phrase dictionaries for different languages.
		 * @example
		 * const phraseFactory = createPhraseFactory()(moduleSettings);
		 * log(phraseFactory.get({ transUnitId: "0" })); // "Success"
		 */
		createPhraseFactory: function () {
			return (moduleSettings) => {

				// Cache Dependencies
				//const logSyslogMessage = EASY_UTILS.getFunction({ functionName: "logSyslogMessage", moduleSettings });
				const replacePlaceholders = EASY_UTILS.getFunction({ functionName: "replacePlaceholders", moduleSettings });
				const getSharedForge = EASY_UTILS.getFunction({ functionName: "getSharedForge", moduleSettings });
				const getSharedVault = EASY_UTILS.getFunction({ functionName: "getSharedVault", moduleSettings });

				// 'PhraseFactory' is the key named used when storing the factory in the Forge
				const phraseFactoryKey = "PhraseFactory";
				const sharedForge = getSharedForge();
				const sharedVault = getSharedVault();

				// If the factory already exists, just return it. Otherwise, create it.
				if (!sharedForge.getFactory({ name: phraseFactoryKey })) {

					/***************************************************************************************************
					 * 1. Define Defaults & In-Memory State
					 **************************************************************************************************/
					const defaultLanguageCode = globalSettings.phraseLanguage || "enUS";

					// Holds all loaded language dictionaries (e.g., { enUS: {...}, frFR: {...} })
					const loadedLanguagePhrases = {};

					// Tracks how many players are currently using each language (e.g., { enUS: 2, frFR: 1 })
					const languageUsageCounts = {};

					// Stores additional phrases provided by modules but not necessarily loaded yet
					// (e.g., { enUS: { "0x003": "Some string" }, frFR: { "0x003": "...fr" } })
					const contributedLanguagePhrases = {};

					// The Vault for storing each player's chosen language (e.g., playerLanguages["player123"] = "frFR")
					// sync to ensure it’s stored in vault
					const playerLanguagesMap = sharedVault.playerLanguages || {};
					sharedVault.playerLanguages = playerLanguagesMap;

					// Tracks which languages are recognized. We might not load them until needed.
					const registeredLanguages = new Set(["enUS", "frFR"]);

					/***************************************************************************************************
					 * Subroutine Function: Base Dictionary for a given language
					 **************************************************************************************************/
					function loadLanguageDictionary(languageCode) {
						if (languageCode === "enUS") {
							return {
								"0": "Success",
								"1": "Failure",
								"10000": ".=> Initializing <=.",
								"20000": ".=> Ready <=.",
								"20100": "Complete: {{ remark }} has been created.",
								"40000": "Invalid Arguments: {{ remark }}",
								"40400": "Not Found: {{ remark }}",
								"50000": "Error: {{ remark }}",
								"30000": "Warning: {{ remark }}",
								"60000": "Information: {{ remark }}",
								"70000": "Debug: {{ remark }}",
								"0x0D9A441E": "Tokens need to be selected or passed by --ids.",
								"0x004A7742": "error",
								"0x0B672E77": "warning",
								"0x0004E2AF": "information",
								"0x000058E0": "tip",
								"0x02B2451A": "You entered the following command:",
								"0x0834C8EE": "If you continue to experience issues contact the module author ({{ author }})."
							};
						} else if (languageCode === "frFR") {
							return {
								"0": "Succès",
								"1": "Échec",
								"10000": ".=> Initialisation <=.",
								"20000": ".=> Prêt <=.",
								"20100": "Terminé : {{ remark }} a été créé.",
								"40000": "Arguments invalides : {{ remark }}",
								"40400": "Non trouvé : {{ remark }}",
								"50000": "Erreur : {{ remark }}",
								"30000": "Avertissement : {{ remark }}",
								"60000": "Information : {{ remark }}",
								"70000": "Débogage : {{ remark }}",
								"0x0D9A441E": "Des jetons doivent être sélectionnés ou passés avec --ids.",
								"0x004A7742": "erreur",
								"0x0B672E77": "avertissement",
								"0x0004E2AF": "information",
								"0x000058E0": "conseil",
								"0x02B2451A": "Vous avez entré la commande suivante :",
								"0x0834C8EE": "Si le problème persiste, contactez l'auteur du module ({{ author }})."
							};
						}

						// If no built-in dictionary exists, return null
						return null;
					}

					/***************************************************************************************************
					 * Subroutine Function: `loadedLanguagePhrases[languageCode]` is in memory
					 **************************************************************************************************/
					function loadOrCreateLanguage(languageCode) {
						// If already loaded, just return
						if (loadedLanguagePhrases[languageCode]) {
							return;
						}

						// Attempt to load built-in translations
						const builtInDictionary = loadLanguageDictionary(languageCode);

						// Start from built-in or empty object
						loadedLanguagePhrases[languageCode] = builtInDictionary || {};

						// Merge any contributed phrases for that language
						if (contributedLanguagePhrases[languageCode]) {
							Object.assign(loadedLanguagePhrases[languageCode], contributedLanguagePhrases[languageCode]);
						}

						// Now consider that language "registered"
						registeredLanguages.add(languageCode);
					}

					/***************************************************************************************************
					 * Subroutine Function: if usage is 0, remove from memory (unless it's default language)
					 **************************************************************************************************/
					function unloadLanguage(languageCode) {
						if (languageUsageCounts[languageCode] <= 0 && languageCode !== defaultLanguageCode) {
							delete loadedLanguagePhrases[languageCode];
						}
					}

					/***************************************************************************************************
					 * 4. Construct the Phrase Factory API
					 **************************************************************************************************/
					const phraseFactoryObject = {

						/**
						 * Retrieves a phrase by its translation unit ID, optionally replacing placeholder variables.
						 *
						 * @param {Object} config - An object containing required and optional parameters.
						 * @param {string} [config.playerId="default"] - The ID of the player whose language setting is used.
						 * @param {string|number} config.transUnitId - The key or identifier for the phrase (e.g., "0", "10000", "0x0D9A441E").
						 * @param {Object} [config.expressions={}] - Key-value pairs for placeholder replacements in the phrase template.
						 * @returns {string} The final string with placeholders replaced, or the `transUnitId` itself if no matching phrase is found.
						 */
						get({ playerId = "default", transUnitId, expressions = {} }) {
							// 1) Determine player’s language or default
							const lang = playerLanguagesMap[playerId] || defaultLanguageCode;

							// 2) Ensure that language is loaded
							if (!loadedLanguagePhrases[lang]) {
								loadOrCreateLanguage(lang);
							}
							const currentLanguageDict = loadedLanguagePhrases[lang];
							const fallbackDict = loadedLanguagePhrases[defaultLanguageCode] || {};

							// 3) Retrieve the string template
							const template = currentLanguageDict[transUnitId] || fallbackDict[transUnitId];

							// 4) If not found, just return the transUnitId itself
							if (!template) {
								return transUnitId;
							}

							// 5) Replace placeholders
							return replacePlaceholders({ string: template, expressions });
						},

						/**
						 * Merges new phrases into the in-memory dictionaries for one or multiple languages.
						 * The caller provides a single `newMap` object with language codes as keys,
						 * and each language’s value is a dictionary of transUnitId → phrase string.
						 *
						 * @param {Object} config - A configuration object.
						 * @param {Object} config.newMap - A map where each key is a language code (e.g. "enUS", "frFR") 
						 *                                 and each value is an object of phrase key-value pairs.
						 *
						 * @example
						 * // Example usage:
						 * add({
						 *   newMap: {
						 *     enUS: {
						 *       "0x03BDB2A5": "Custom Menu",
						 *       "0x08161075": "Set Preferred Language"
						 *     },
						 *     frFR: {
						 *       "0x03BDB2A5": "Menu personnalisé",
						 *       "0x08161075": "Définir la langue préférée"
						 *     }
						 *   }
						 * });
						 *
						 * @returns {void}
						 */
						add({ newMap }) {

							// Iterate over each language in the provided `newMap`
							for (const [langCode, phraseMap] of Object.entries(newMap)) {
								// Mark this language as registered
								registeredLanguages.add(langCode);

								// Ensure we have a contributed dictionary for that language
								contributedLanguagePhrases[langCode] = contributedLanguagePhrases[langCode] || {};
								// Merge the new phrases into contributedLanguagePhrases
								Object.assign(contributedLanguagePhrases[langCode], phraseMap);

								// If the language is already loaded in memory, merge them immediately
								if (loadedLanguagePhrases[langCode]) {
									Object.assign(loadedLanguagePhrases[langCode], phraseMap);
								}
							}
						},

						/**
						 * Sets (or changes) the language for a specific player.
						 * Decrements usage on the old language if present, increments usage on the new language.
						 *
						 * @param {Object} config - An object containing the parameters.
						 * @param {string|number} config.playerId - The unique identifier for the player.
						 * @param {string} config.language - The new language code to assign to the player (e.g. "enUS", "frFR").
						 * @returns {void}
						 */
						setLanguage({ playerId, language }) {
							// 1) Decrement usage count for old language if any
							const oldLang = playerLanguagesMap[playerId];
							if (oldLang && languageUsageCounts[oldLang]) {
								languageUsageCounts[oldLang]--;
								if (languageUsageCounts[oldLang] <= 0) {
									unloadLanguage(oldLang);
								}
							}

							// 2) Assign the new language
							playerLanguagesMap[playerId] = language;

							// 3) Ensure new language is loaded
							if (!loadedLanguagePhrases[language]) {
								loadOrCreateLanguage(language);
							}

							// 4) Increment usage count for the new language
							languageUsageCounts[language] = (languageUsageCounts[language] || 0) + 1;
						},

						/**
						 * Retrieves a list of all recognized or currently loaded languages.
						 *
						 * @returns {string[]} An array of language codes (e.g., ["enUS", "frFR"]).
						 */
						getLanguages() {
							// Some may be known from built-in or contributed, some loaded already
							const loadedLangs = Object.keys(loadedLanguagePhrases);
							const allLangs = new Set([...registeredLanguages, ...loadedLangs]);

							return Array.from(allLangs);
						},

						/**
						 * Removes a specific phrase entry from a language’s dictionary,
						 * including both contributed phrases and loaded phrases if present.
						 *
						 * @param {Object} config - An object containing the parameters.
						 * @param {string} config.language - The language code to remove the phrase from.
						 * @param {string|number} config.transUnitId - The key/ID of the phrase to remove.
						 * @returns {void}
						 */
						remove({ language, transUnitId }) {
							delete contributedLanguagePhrases[language]?.[transUnitId];
							if (loadedLanguagePhrases[language]) {
								delete loadedLanguagePhrases[language][transUnitId];
							}
						},

						/**
						 * Resets and clears all language data, usage counts, and player assignments.
						 * Re-registers only the default language with zero usage.
						 *
						 * @returns {void}
						 */
						init() {
							// 1) Clear out all language data in memory
							for (const langCode of Object.keys(loadedLanguagePhrases)) {
								delete loadedLanguagePhrases[langCode];
							}
							for (const langCode of Object.keys(contributedLanguagePhrases)) {
								delete contributedLanguagePhrases[langCode];
							}
							for (const langCode of Object.keys(languageUsageCounts)) {
								delete languageUsageCounts[langCode];
							}
							for (const pid of Object.keys(playerLanguagesMap)) {
								delete playerLanguagesMap[pid];
							}

							// 2) Reset registered languages to just the default
							registeredLanguages.clear();
							registeredLanguages.add(defaultLanguageCode);

							// 3) Reload the default language
							loadOrCreateLanguage(defaultLanguageCode);
							languageUsageCounts[defaultLanguageCode] = 0;
						}

					};

					/***************************************************************************************************
					 * 5. Initial Setup
					 **************************************************************************************************/

					// Ensure default language is loaded; set usage to 0 for "default" player
					phraseFactoryObject.setLanguage({
						playerId: "default",
						language: defaultLanguageCode
					});
					languageUsageCounts[defaultLanguageCode] = 0;

					// Store the newly created factory in the Forge
					sharedForge.setFactory({
						name: phraseFactoryKey,
						factory: phraseFactoryObject
					});
				}

				// Return the existing or newly created factory
				return sharedForge.getFactory({ name: phraseFactoryKey });
			};
		},

		// ANCHOR Function: createTemplateFactory
		/**
		 * @summary Manage and retrieve HTML templates by name.
		 * @example
		 * const templateFactory = createTemplateFactory()(moduleSettings);
		 * log(templateFactory.get({ template: "default", content: { tableRows: "<tr><td>Key</td><td>Value</td></tr>" } }));
		 */
		createTemplateFactory: function () {
			return (moduleSettings) => {

				// Cache Dependencies
				//const logSyslogMessage = EASY_UTILS.getFunction({ functionName: "logSyslogMessage", moduleSettings });
				const replacePlaceholders = EASY_UTILS.getFunction({ functionName: "replacePlaceholders", moduleSettings });
				const getSharedForge = EASY_UTILS.getFunction({ functionName: "getSharedForge", moduleSettings });
				const convertHtmlToJson = EASY_UTILS.getFunction({ functionName: "convertHtmlToJson", moduleSettings });

				const templateFactoryKey = "TemplateFactory";
				const forgeInstance = getSharedForge();

				const htmlDefault = `
				<table border="1" style="border-collapse: collapse; width: 100%;">
					<thead>
						<tr>
							<th style="padding: 8px; text-align: left; background-color: #34627B; color: white;">Key</th>
							<th style="padding: 8px; text-align: left; background-color: #34627B; color: white;">Value</th>
						</tr>
					</thead>
					<tbody>
						<tr style="background-color: #d9f7d1;">
							<td style="padding: 8px;">Name</td>
							<td style="padding: 8px;">John Doe</td>
						</tr>
						<tr>
							<td style="padding: 8px;">Age</td>
							<td style="padding: 8px;">30</td>
						</tr>
						<tr style="background-color: #d9f7d1;">
							<td style="padding: 8px;">City</td>
							<td style="padding: 8px;">New York</td>
						</tr>
					</tbody>
					<tfoot>
						<tr>
							<td style="padding: 8px; font-weight: bold; background-color: #34627B; color: white;" colspan="2">End of
								Data</td>
						</tr>
					</tfoot>
				</table>`;

				// If the factory already exists, just return it. Otherwise, create it.
				if (!forgeInstance.getFactory({ name: templateFactoryKey })) {

					/*******************************************************************************************************
					 * 1. Define In-Memory Template Map and Default Template
					 ******************************************************************************************************/
					const templateMemoryMap = {
						"default": `${htmlDefault}`
					};

					/***************************************************************************************************
					 * Subroutine Function: Loads additional templates on demand, if available.
					 **************************************************************************************************/
					function loadTemplateByName(templateName) {
						if (templateName === "chatAlert") {
							return `
							<div class="alert-box">
								<h3>{{ title }}</h3>
								<p>{{ description }}</p>
								<div class="alert-code">
									<p>{{ code }}</p>
								</div>
								<p>{{ remark }}</p>
								<p class="alert-footer">{{ footer }}</p>
							</div>`;
						}

						// If no known additional template is found, return null
						return null;
					}

					/*******************************************************************************************************
					 * 2. Construct the Template Factory API
					 ******************************************************************************************************/
					const templateFactoryObject = {

						/**
						 * Retrieves a template by name, optionally replacing placeholders.
						 *
						 * @param {Object} config - Configuration object.
						 * @param {string} [config.template="default"] - The template name (key).
						 * @param {Object} [config.expressions={}] - The placeholders (key-value pairs) to be replaced.
						 * @returns {string} The final template with placeholders replaced.
						 */
						get: ({ template = "default", expressions = {} } = {}) => {
							// If the requested template is not in memory, try to load it externally
							if (!templateMemoryMap[template]) {
								const loadedTemplate = loadTemplateByName(template);
								if (loadedTemplate) {
									templateMemoryMap[template] = loadedTemplate;
								} else {
									// If still not found, revert to "default"
									template = "default";
								}
							}

							// Grab the template string (either requested or default)
							const templateString = templateMemoryMap[template];

							// Replace placeholders and return
							return replacePlaceholders({ string: templateString, expressions });
						},

						/**
						 * Replaces the entire in-memory map of templates with a new map.
						 *
						 * @param {Object} config - Configuration object.
						 * @param {Object} config.newMap - A key-value map of templateName => templateString.
						 * @returns {void}
						 */
						set: ({ newMap }) => {
							// Clear existing templates
							Object.keys(templateMemoryMap).forEach((key) => {
								delete templateMemoryMap[key];
							});
							// Load new ones
							Object.assign(templateMemoryMap, newMap);
						},

						/**
						 * Adds new templates or overrides existing ones in the in-memory map.
						 *
						 * @param {Object} config - Configuration object.
						 * @param {Object} config.newTemplates - A key-value map of templateName => templateString.
						 * @returns {void}
						 */
						add: ({ newTemplates }) => {
							Object.entries(newTemplates).forEach(([name, htmlString]) => {
								templateMemoryMap[name] = htmlString.trim();
							});
						},

						/**
						 * Removes a template by name from the in-memory map.
						 *
						 * @param {Object} config - Configuration object.
						 * @param {string} config.template - The name of the template to remove.
						 * @returns {void}
						 */
						remove: ({ template }) => {
							delete templateMemoryMap[template];
						},

						/**
						 * Resets the template memory map to a default state.
						 *
						 * @returns {void}
						 */
						init: () => {

							// Clear everything
							Object.keys(templateMemoryMap).forEach((key) => {
								delete templateMemoryMap[key];
							});

							// Load a minimal default
							templateMemoryMap["default"] = convertHtmlToJson({ html: htmlDefault });
						}
					};

					// --------------------------------------------------------
					// Initial Setup
					// --------------------------------------------------------
					forgeInstance.setFactory({ name: templateFactoryKey, factory: templateFactoryObject });
				}

				// Return existing or newly created
				return forgeInstance.getFactory({ name: templateFactoryKey });
			};
		},


		// ANCHOR Function: createThemeFactory
		/**
		 * @summary Manage and retrieve theme JSON for styling HTML JSON output.
		 * @example
		 * const themeFactory = createThemeFactory()(moduleSettings);
		 * log(themeFactory.get({ theme: "default" })); // Default theme JSON
		 */
		createThemeFactory: function () {
			return (moduleSettings) => {

				// Cache Dependencies
				// const logSyslogMessage = EASY_UTILS.getFunction({ functionName: "logSyslogMessage", moduleSettings });
				const replacePlaceholders = EASY_UTILS.getFunction({ functionName: "replacePlaceholders", moduleSettings });
				const getSharedForge = EASY_UTILS.getFunction({ functionName: "getSharedForge", moduleSettings });

				// Key used to store and retrieve the ThemeFactory in the Forge
				const themeFactoryKey = "ThemeFactory";
				const forgeInstance = getSharedForge();

				// If the factory already exists, just return it. Otherwise, create it.
				if (!forgeInstance.getFactory({ name: themeFactoryKey })) {

					/***************************************************************************************************
					 * 1. Define In-Memory Theme Map and Default Theme
					 **************************************************************************************************/
					const themeMemoryMap = {
						"default": ""
					};

					/***************************************************************************************************
					 * Subroutine Function: Dynamically loads additonal themes if available.
					 **************************************************************************************************/
					function loadThemeByName(themeName) {
						if (themeName === "chatAlert") {
							return `
							/* Design Colors */
							:root {
								--ez-primary-background-color: #252B2C; 
								--ez-subdued-background-color: #f2f2f2; 
								--ez-text-color: #000000;
								--ez-overlay-text-color: #ffffff; 
								--ez-border-color: #000000; 
								--ez-shadow-color: #4d4d4d; 
							}
							
							.alert-box {
								border: 1px solid var(--ez-border-color);
								background-color: var(--ez-primary-background-color);
								padding: 10px;
								border-radius: 10px;
								color: var(--ez-text-color);
							}
							
							h3 {
								color: var(--ez-overlay-text-color);
								margin: 0;
								font-size: 1.2em;
								text-transform: uppercase;
							}
							
							p {
								margin: 5px 0;
							}
							
							.alert-code {
								margin: 8px 0;
								padding: 5px;
								background-color: var(--ez-subdued-background-color);
								border: var(--ez-shadow-color);
								border-radius: 5px;
								font-family: monospace;
							}
							
							.alert-footer {
								margin: 5px 0;
								font-size: 0.9em;
								color: var(--ez-shadow-color);
							}`;
						}

						// If no matching additional theme is found, return null
						return null;
					}

					/*******************************************************************************************************
					 * 2. Construct the Theme Factory API
					 ******************************************************************************************************/
					const themeFactoryObject = {

						/**
						 * Retrieves a theme by name, optionally replacing placeholders and CSS variables.
						 * Collapses multiple whitespace characters into a single space for cleaner output.
						 *
						 * @param {Object} config - Configuration object.
						 * @param {string} [config.theme="default"] - The name/key of the theme to retrieve.
						 * @param {Object} [config.expressions={}] - Key-value pairs for placeholder replacements.
						 * @param {Object} [config.cssVars={}] - Key-value pairs for CSS variable replacements.
						 * @returns {string} The final theme string with placeholders and CSS variables replaced.
						 */
						get: ({ theme = "default", expressions = {}, cssVars = {} } = {}) => {
							// 1) Load the requested theme if not already loaded
							if (!themeMemoryMap[theme]) {
								const loadedTheme = loadThemeByName(theme);
								if (loadedTheme) {
									themeMemoryMap[theme] = loadedTheme;
								} else {
									// Fallback to default theme if the requested one isn't found
									theme = "default";
								}
							}

							// 2) Retrieve the theme string
							const themeString = themeMemoryMap[theme];

							// 3) Replace placeholders and CSS variables, then normalize whitespace
							return replacePlaceholders({ string: themeString, expressions, cssVars });
						},

						/**
						 * Replaces the entire in-memory theme map with a new set of themes.
						 *
						 * @param {Object} config - Configuration object.
						 * @param {Object} config.newMap - A key-value map where keys are theme names and values are theme strings.
						 * @returns {void}
						 */
						set: ({ newMap }) => {
							// Clear existing themes
							Object.keys(themeMemoryMap).forEach((key) => {
								delete themeMemoryMap[key];
							});
							// Assign new themes
							Object.assign(themeMemoryMap, newMap);
						},

						/**
						 * Adds or updates themes in the in-memory theme map.
						 *
						 * @param {Object} config - Configuration object.
						 * @param {Object} config.newThemes - A key-value map where keys are theme names and values are theme strings.
						 * @returns {void}
						 */
						add: ({ newThemes }) => {
							Object.entries(newThemes).forEach(([name, themeString]) => {
								themeMemoryMap[name] = themeString.trim();
							});
						},

						/**
						 * Removes a specific theme from the in-memory theme map.
						 *
						 * @param {Object} config - Configuration object.
						 * @param {string} config.theme - The name of the theme to remove.
						 * @returns {void}
						 */
						remove: ({ theme }) => {
							delete themeMemoryMap[theme];
						},

						/**
						 * Initializes the theme map to a default state, clearing all existing themes.
						 *
						 * @returns {void}
						 */
						init: () => {
							// Clear all themes
							Object.keys(themeMemoryMap).forEach((key) => {
								delete themeMemoryMap[key];
							});
							// Reset to default theme
							themeMemoryMap["default"] = "{\"universal\": {},\"elements\": {},\"classes\": {},\"attributes\": {},\"functions\": {},\"ids\": {}}";
						}
					};

					// --------------------------------------------------------
					// Initial Setup
					// --------------------------------------------------------
					forgeInstance.setFactory({ name: themeFactoryKey, factory: themeFactoryObject });
				}

				// Return existing or newly created
				return forgeInstance.getFactory({ name: themeFactoryKey });
			};
		},

		// ANCHOR Function Loader: decodeNoteContent
		/**
		 * @summary Decode HTML-encoded note content into plain text.
		 * @see 
		 * @example
		 * const decoded = decodeNoteContent()({ text: "&lt;div&gt;Hello&lt;/div&gt;" });
		 * log(decoded); // "<div>Hello</div>"
		 */
		decodeNoteContent: function () {
			return (moduleSettings) => {

				// Cache Dependencies
				const logSyslogMessage = EASY_UTILS.getFunction({ functionName: "logSyslogMessage", moduleSettings });

				return ({ text }) => {
					if (typeof text !== "string") {
						if (moduleSettings.verbose) {

							logSyslogMessage({
								severity: 7,
								tag: "decodeNoteContent",
								transUnitId: "70000",
								message: "Invalid Argument: 'text' is not a string, returning input."
							});
						}

						return text;
					}

					return text
						.replace(/&lt;/g, "<")
						.replace(/&gt;/g, ">")
						.replace(/&quot;/g, "\"")
						.replace(/&#39;/g, "'")
						.replace(/&nbsp;/g, " ")
						.replace(/<br>/g, "\n")
						.replace(/&amp;/g, "&");
				};
			};
		},

		// ANCHOR Function Loader: encodeNoteContent
		/**
		 * @summary Encode plain text into HTML-encoded note content.
		 * @example
		 * const encoded = encodeNoteContent()({ text: "<div>Hello</div>" });
		 * log(encoded); // "&lt;div&gt;Hello&lt;/div&gt;"
		 */
		encodeNoteContent: function () {
			return (moduleSettings) => {

				// Cache Dependencies
				const logSyslogMessage = EASY_UTILS.getFunction({ functionName: "logSyslogMessage", moduleSettings });

				return ({ text }) => {
					if (typeof text !== "string") {
						if (moduleSettings.verbose) {
							logSyslogMessage({
								severity: 7,
								tag: "encodeNoteContent",
								transUnitId: "70000",
								message: "Invalid Argument: 'text' is not a string, returning input."
							});
						}

						return text;
					}

					return text
						.replace(/&/g, "&amp;")
						.replace(/</g, "&lt;")
						.replace(/>/g, "&gt;")
						.replace(/"/g, "&quot;")
						.replace(/'/g, "&#39;")
						.replace(/ /g, "&nbsp;")
						.replace(/\n/g, "<br>");
				};
			};
		},

		// ANCHOR Function Loader: getGLobalSettings
		getGlobalSettings: function () {
			// eslint-disable-next-line no-unused-vars
			return (moduleSettings) => {
				return globalSettings;
			};
		},

		// ANCHOR Function Loader: getSharedForge
		/**
		 * @summary Retrieve the global EASY_MODULE_FORGE registry.
		 * @example
		 * const forge = getSharedForge()(moduleSettings)();
		 * forge.setFactory({name: "TestFactory", factory: {test:1}});
		 * log(forge.getFactory({name: "TestFactory"})); // {test:1}
		 */
		getSharedForge: function () {
			// eslint-disable-next-line no-unused-vars
			return (moduleSettings) => {
				return () => {

					// FIXME Dynamically load forge based on global settings.
					// Because the sandbox does not have a global, we have to access the forge object by name.
					// One alternative is to maintain the same name for a Forge object and manage multiple forges.
					// Todo so means adding extra logic to factories and still the global multiple factory containing
					// forge would still need to be a consistent name. At this moment this is no added benefit in
					// managing multiple forges under a global object, therefore we access a singleton global Forge, and
					// use the same name.
					return EASY_MODULE_FORGE;
				};
			};
		},

		// ANCHOR Function Loader: getSharedVault
		/**
		 * @summary Retrieve or initialize the shared vault state.
		 * @example
		 * const vault = getSharedVault()(moduleSettings)();
		 * vault.myData = "Hello";
		 * log(state.EasyModuleVault); // { myData: "Hello" }
		 */
		getSharedVault: function () {
			return (moduleSettings) => {

				// Cache Dependencies
				const logSyslogMessage = EASY_UTILS.getFunction({ functionName: "logSyslogMessage", moduleSettings });

				return () => {
					const vaultName = globalSettings.sharedVaultName;
					if (!state[vaultName]) {
						state[vaultName] = {};
						if (moduleSettings.verbose) {
							logSyslogMessage({
								severity: 7,
								tag: "getSharedVault",
								transUnitId: "70000",
								message: `Not Found: Shared vault undefined, initializing 'state.${vaultName}'.`,
							});
						}
					}

					return state[vaultName];
				};
			};
		},

		// ANCHOR Function Loader: logSyslogMessage
		/**
		 * @summary Log a structured message with severity and module tagging.
		 * @example
		 * const logger = logSyslogMessage()(moduleSettings);
		 * logger({ severity: 6, tag: "MyModule", transUnitId: "1000", message: "Informational message" });
		 */
		logSyslogMessage: function () {
			return (moduleSettings) => {
				return ({ severity, tag, transUnitId, message }) => {
					const getSyslogTimestamp = () => { return new Date().toISOString(); };
					const severityMap = {
						3: "ERROR",
						4: "WARN",
						6: "INFO",
						7: "DEBUG",
					};
					const normalizedSeverity = severityMap[severity] ? severity : 6;
					const moduleName = moduleSettings?.readableName || "UNKNOWN_MODULE";
					const logMessage = `<${severityMap[normalizedSeverity]}> ${getSyslogTimestamp()} [${moduleName}](${tag}): {"transUnitId": ${transUnitId}, "message": "${message}"}`;
					try {
						log(logMessage);

						return logMessage;
					}
					catch (err) {
						// REVIEW I do not see what error that could occur is recoverable from.
					}
				};
			};
		},

		// ANCHOR Function Loader: parseChatCommands
		/**
		 * @summary Parse chat input into main and subcommands.
		 * @example
		 * const commandMap = parseChatCommands()(moduleSettings)({ apiCallContent: "!mycmd --alert --lang frFR" });
		 * log([...commandMap]); // [["--alert", []], ["--lang", ["frFR"]]]
		 */
		parseChatCommands: function () {
			// eslint-disable-next-line no-unused-vars
			return (moduleSettings) => {
				return ({ apiCallContent }) => {
					const commandMap = new Map();
					const normalizedContent = apiCallContent.trim();
					const segments = normalizedContent.split("--").filter(segment => { return segment.trim() !== ""; });
					segments.forEach((segment, index) => {
						if (index === 0 && segment.trim().startsWith("!")) {
							return;
						}
						const trimmedSegment = segment.trim();
						const [command, ...args] = trimmedSegment.split(/\s+/);
						const cleanCommand = command.toLowerCase().trim();
						commandMap.set(`--${cleanCommand}`, args);
					});

					return commandMap;
				};
			};
		},

		// ANCHOR Function Loader: parseChatSubcommands
		/**
		 * @summary Parse subcommands into key-value pairs or flags.
		 * @example
		 * const subMap = parseChatSubcommands()(moduleSettings)({ subcommands: ["key|value", "flag"] });
		 * log(subMap); // { key: "value", flag: true }
		 */
		parseChatSubcommands: function () {
			// eslint-disable-next-line no-unused-vars
			return (moduleSettings) => {
				return ({ subcommands }) => {
					const subcommandMap = {};
					subcommands.forEach(arg => {
						const delimiterMatch = arg.includes("|") ? "|" : arg.includes("#") ? "#" : null;
						if (delimiterMatch) {
							const [key, value] = arg.split(delimiterMatch);
							subcommandMap[key] = value;
						} else {
							subcommandMap[arg] = true;
						}
					});

					return subcommandMap;
				};
			};
		},

		// ANCHOR Function Loader: replacePlaceholders
		/**
		 * @summary Replace placeholders in a string with token values and evaluate inline expressions.
		 * @example
		 * const replaced = replacePlaceholders()(moduleSettings)({ string: "Hello {{name}}!", expressions: { name: "World" } });
		 * log(replaced); // "Hello World!"
		 */
		replacePlaceholders: function () {
			// eslint-disable-next-line no-unused-vars
			return (moduleSettings) => {
				return ({ string, expressions = {}, cssVars = {} }) => {
					return string
						.replace(/{{(.*?)}}/g, (_, key) => {
							return expressions[key.trim()] || "";
						})
						.replace(/\[\[(.*?)\]\]/g, (_, anExpression) => {

							// REVIEW I may add a seperate prefix like [[ expr() ]] for custom expressions, but for now
							// I am content having the Roll20 replace [[]] as inline rolls.
							// styling can be cumbersome so I am going to wrap the text in a span for CSS.
							return `<span class="inline-rolls">[[${anExpression.trim()}]]</span>`;
						})
						.replace(/var\((--[\w-]+)\)/g, (_, cssVar) => {
							return cssVars[cssVar.trim()] || `var(${cssVar.trim()})`;
						});
				};
			};
		},

		// !SECTION End of Utility Functions: Low Level

		/***************************************************************************************************************
		 * SECTION: UTILITY FUNCTIONS - High Level
		 *
		 * This section contains essential, reusable functions that handle complex tasks and module-level operations.
		 *
		 * - High-level functions use lower-level utilities.
		 * - These functions may rely on `moduleSettings` for context and configuration specific to the calling module.
		 * - High-level functions should attempt to fall back to default values or configurations when issues arise.
		 * - If a fallback is not possible and the outcome remains erroneous, they should log the issue and throw an
		 *   error to the Roll20 API to ensure proper debugging and system stability.
		 **************************************************************************************************************/

		// ANCHOR Function Loader: renderTemplateAsync
		/**
		 * @summary Render an HTML template with placeholders and apply a theme asynchronously.
		 * @example
		 * const rendered = await renderTemplateAsync()(moduleSettings)({ template: "chatAlert", content: { title: "Warning" }, theme: "chatAlert" });
		 * log(rendered); // "<div ...>...</div>"
		 */
		renderTemplateAsync: function () {
			return (moduleSettings) => {

				// Cache Dependencies
				// const logSyslogMessage = EASY_UTILS.getFunction({ functionName: "logSyslogMessage", moduleSettings });
				const templateFactory = EASY_UTILS.getFunction({ functionName: "createTemplateFactory", moduleSettings });
				const themeFactory = EASY_UTILS.getFunction({ functionName: "createThemeFactory", moduleSettings });
				const applyCssToHtmlJson = EASY_UTILS.getFunction({ functionName: "applyCssToHtmlJson", moduleSettings });
				const convertJsonToHtml = EASY_UTILS.getFunction({ functionName: "convertJsonToHtml", moduleSettings });
				const convertHtmlToJson = EASY_UTILS.getFunction({ functionName: "convertHtmlToJson", moduleSettings });
				const convertCssToJson = EASY_UTILS.getFunction({ functionName: "convertCssToJson", moduleSettings });

				return async ({ template, expressions = {}, theme, cssVars = {} }) => {

					try {
						const [fetchedTemplate, fetchedTheme] = await Promise.all([
							templateFactory.get({ template, expressions, cssVars }),
							themeFactory.get({ theme, expressions, cssVars })
						]);

						const styledJson = applyCssToHtmlJson({
							cssJson: convertCssToJson({ css: fetchedTheme }),
							htmlJson: convertHtmlToJson({ html: fetchedTemplate })
						});

						const output = convertJsonToHtml({ htmlJson: styledJson });

						return output;
					} catch (err) {
						throw new Error(`${err}`);
					}
				};
			};
		},

		// ANCHOR Function Loader: whisperAlertMessageAsync
		/**
		 * @summary Asynchronously render an alert message template and whisper it to a player.
		 * @example
		 * await whisperAlertMessageAsync()(moduleSettings)({ from: "System", to: "gm", severity: "WARNING", title: "Alert", description: "Something happened." });
		 */
		whisperAlertMessageAsync: function () {
			return (moduleSettings) => {

				// Cache Dependencies
				// const logSyslogMessage = EASY_UTILS.getFunction({ functionName: "logSyslogMessage", moduleSettings });
				const renderTemplateAsync = EASY_UTILS.getFunction({ functionName: "renderTemplateAsync", moduleSettings });
				const whisperPlayerMessage = EASY_UTILS.getFunction({ functionName: "whisperPlayerMessage", moduleSettings });
				const PhraseFactory = EASY_UTILS.getFunction({ functionName: "createPhraseFactory", moduleSettings });

				return async ({ from, to, toId, severity = 6, apiCallContent, remark }) => {

					const severityEnum = {
						error: {
							code: 3,
							titleTransUnitId: "0x004A7742",
							bgColor: "#ffdddd",
							titleColor: "#FF0000"
						},
						warning: {
							code: 4,
							titleTransUnitId: "0x0B672E77",
							bgColor: "#FBE7A1",
							titleColor: "#CA762B"
						},
						information: {
							code: 6,
							titleTransUnitId: "0x0004E2AF",
							bgColor: "#b8defd",
							titleColor: "#2516f5"
						},
						tip: {
							code: 7,
							titleTransUnitId: "0x000058E0",
							bgColor: "#C3FDB8",
							titleColor: "#16F529"
						}
					};

					// Reverse mapping for code lookup
					const severityCodeMap = Object.fromEntries(
						Object.entries(severityEnum).map(([key, value]) => { return [value.code, key]; })
					);

					const normalizedSeverity =
						typeof severity === "string"
							? severity.toLowerCase()
							: severityCodeMap[severity] || "info";

					const alertConfig = severityEnum[normalizedSeverity] || severityEnum.info;

					/*
					<div class="alert-box">
						<h3>{{ title }}</h3>
						<p>{{ description }}</p>
						<div class="alert-code">
							<p>{{ code }}</p>
						</div>
						<p>{{ remark }}</p>
						<p class="alert-footer">{{ footer }}</p>
					</div>
					*/

					const alertContent = {
						title: PhraseFactory.get({ playerId: toId, transUnitId: alertConfig.titleTransUnitId }),
						description: PhraseFactory.get({ playerId: toId, transUnitId: "0x02B2451A" }),
						code: apiCallContent,
						remark,
						footer: PhraseFactory.get({ playerId: toId, transUnitId: "0x0834C8EE", expressions: { author: `${moduleSettings.author}` } })
					};

					/* Design Colors
						:root {
							--ez-primary-background-color: #252B2C;
							--ez-subdued-background-color: #f2f2f2;
							--ez-overlay-text-color: #ffffff;
							--ez-shadow-color: #4d4d4d;
						}...
						*/

					const alertPalette = {
						"--ez-primary-background-color": alertConfig.bgColor,
						"--ez-overlay-text-color": alertConfig.titleColor,
					};

					try {
						const styledMessage = await renderTemplateAsync({
							template: "chatAlert",
							expressions: alertContent,
							theme: "chatAlert",
							cssVars: alertPalette,
						});


						whisperPlayerMessage({ from, to, message: styledMessage });

						return 0;
					} catch (err) {
						throw new Error(`${err}`);
					}
				};
			};
		},

		// ANCHOR Function Loader: whisperPlayerMessage
		/**
		 * @summary Whisper a message to a player in chat.
		 * @example
		 * whisperPlayerMessage()(moduleSettings)({ from: "System", to: "gm", message: "Hello GM!" });
		 */
		whisperPlayerMessage: function () {
			return (moduleSettings) => {

				// Cache Dependencies
				const logSyslogMessage = EASY_UTILS.getFunction({ functionName: "logSyslogMessage", moduleSettings });

				return ({ from, to, message }) => {
					const sender = from || moduleSettings.readableName;
					const recipient = to || "gm";

					try {
						sendChat(sender, `/w ${recipient} ${message}`);

						return `${sender};;${recipient};;${message}`;
					} catch (err) {

						logSyslogMessage({
							severity: 3,
							tag: "whisperPlayerMessage",
							transUnitId: "30000",
							message: `${err}`,
						});

						return `!${sender};;${recipient};;${message}`;
					}
				};
			};
		},
		// !SECTION End of Utility Functions: High Level
	};

	/*******************************************************************************************************************
	* SECTION INITIALIZATION
	*******************************************************************************************************************/
	const checkInstall = () => {

		if (typeof EASY_UTILS !== "undefined") {

			const requiredFunctions = [
				"getSharedForge",
				"createPhraseFactory",
				"createTemplateFactory",
				"createThemeFactory",
				"whisperAlertMessageAsync",
				"logSyslogMessage",
				"parseChatCommands"
			];

			Utils = EASY_UTILS.fetchUtilities({
				requiredFunctions,
				moduleSettings
			});

			// Invoke factories to ensure registration in the forge
			PhraseFactory = Utils.createPhraseFactory;
			TemplateFactory = Utils.createTemplateFactory;
			ThemeFactory = Utils.createThemeFactory;

			const msgId = "10000";
			Utils.logSyslogMessage({
				severity: 6,
				tag: "checkInstall",
				transUnitId: msgId,
				message: PhraseFactory.get({ transUnitId: msgId })
			});

			return 0;
		}
		else {

			const _getSyslogTimestamp = () => { return new Date().toISOString(); };
			const logMessage = `<ERROR> ${_getSyslogTimestamp()} [${moduleSettings.readableName}](checkInstall): {"transUnitId": 50000, "message": "Unexpected Error occurred initializing ${moduleSettings.globalName}"}`;
			log(logMessage);

			return 1;
		}
	};

	on("ready", () => {

		state.EasyModuleVault = {};

		const continueMod = checkInstall();
		if (continueMod === 0) {

			// registerEventHandlers();

			const msgId = "20000";
			Utils.logSyslogMessage({
				severity: 6,
				tag: "registerEventHandlers",
				transUnitId: msgId,
				message: PhraseFactory.get({ transUnitId: msgId })
			});
		}
	});

	// !SECTION END of INITIALIZATION

	/*******************************************************************************************************************
	 * SECTION: PUBLIC INTERFACE
	 *
	 * This section provides a streamlined interface to access utility functions and factories within the system.
	 *
	 * - Functions are dynamically loaded on demand to optimize performance and resource usage.
	 * - Factory functions (e.g., _createPhraseFactory, _createTemplateFactory, _createThemeFactory) are returned
	 *   directly without additional binding or configuration.
	 * - Standard functions are retrieved and bound with the caller's `moduleSettings` to ensure contextual execution.
	 * - If a requested function is not found, the interface throws a descriptive error to facilitate debugging.
	 * - This design ensures a clean, modular approach for accessing utilities while maintaining system stability.
	 ******************************************************************************************************************/

	const loadedFunctions = {};

	return {

		// ANCHOR Method: getFunction
		getFunction: ({ functionName, moduleSettings }) => {
			// Check if the function Function Loader for this functionName exists
			if (!functionLoaders[functionName]) {
				// Function not found: return undefined to fail quietly

				const msgId = "40400";
				Utils.logSyslogMessage({
					severity: 4,
					tag: `${moduleSettings.readableName}:checkInstall`,
					transUnitId: msgId,
					message: PhraseFactory.get({ transUnitId: msgId, expressions: { remark: functionName } })
				});

				return undefined;
			}

			if (!loadedFunctions[functionName]) {
				loadedFunctions[functionName] = functionLoaders[functionName]();
			}

			if (factoryFunctions.includes(functionName)) {
				// Calling the factory function with moduleSettings ensures it's registered in the forge
				return loadedFunctions[functionName](moduleSettings);
			}

			if (typeof loadedFunctions[functionName] === "function") {
				return loadedFunctions[functionName](moduleSettings);
			}

			return loadedFunctions[functionName];
		},

		// ANCHOR Method: fetchedUtilities
		fetchUtilities: ({ requiredFunctions, moduleSettings }) => {
			return requiredFunctions.reduce((accumulator, functionName) => {
				accumulator[functionName] = EASY_UTILS.getFunction({ functionName, moduleSettings });

				return accumulator;
			}, {});
		}
	};
	// !SECTION END of PUBLIC INTERFACE
})();

/* For Local testing when mocking Roll20 */
export { EASY_MODULE_FORGE };
export { EASY_UTILS };

