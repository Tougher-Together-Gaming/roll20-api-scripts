I made  a script called Easy-utils, which is a library of basic functions that can help speed making a mod. and an example of using the library in easy-util-menu.js


[easy-utils.js](https://github.com/Tougher-Together-Gaming/roll20-api-scripts/blob/main/src/easy-utils/easy-utils.js)
[easy-utils-menu.js](https://github.com/Tougher-Together-Gaming/roll20-api-scripts/blob/main/src/easy-utils/easy-utils-menu.js)

# 📜 **Features**

### 1. **Dynamic Module Loading**
- Dynamically load and manage utility functions. Its uses closures to customize functions for the retrieving module and memory efficinecy.
- Avoid redundant code with a centralized, reusable library.
- A special global Object called a Forge contains Factories that present API for specialized use across all APi scripts making use of EASY_UTILS.
	- These factories are Phrase, Template, and Theme factories.

### 2. **Advanced Logging System**
- Log messages in a structured, syslog-like format to enhance debugging and traceability.
- Multilingual logging support through `PhraseFactory`.

### 3. **Translation Support**
- Integrate with `PhraseFactory` to support multilingual scripts.
- Players can select from available languages that they want their whispers displayed in.
- Script makers can upload custom dictionaries for different languages.
- dictionaries that are not used by any players are unloaded form memory.

### 4. **Use CSS and HTML**
- There is a collection of functions that make working with raw HTML and CSS easy.
- The CSS works with universal (*), Element, Ids, Class, Attributes, :root and nth-child pseudo classes
- More rules can be added in the future
- You can use handle bar expressions `{{ ... }}` in HTMl templates for placeholders.
- You can use `var()` in CSS to apply universal color palettes.

### 5. **Robust Error Handling**
- Utility functions provide clear and actionable error messages to improve debugging.

### 6. **Developer Convenience**
- Functions like `logSyslogMessage` enable structured and consistent logging across scripts.
- Quickly build new APi scripts using a shared library of utility fuctions.
- `easy-utils-menu.js` is an example of how a mod might look
