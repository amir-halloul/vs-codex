export const languageSingleLineComments: { [language: string]: string[] } = {
    "c": ["//"],
    "cpp": ["//"],
    "csharp": ["//"],
    "python": ["#"],
    "typescript": ["//"],
    "javascript": ["//"],
    "java": ["//"],
    "html": ["<!--"],
    "xml": ["<!--"],
    "json": []
};

export const languageMultiLineComments: { [language: string]: string[] } = {
    "c": ["/*"],
    "cpp": ["/*"],
    "csharp": ["/*"],
    "python": ["'''"],
    "typescript": ["/*"],
    "javascript": ["/*"],
    "java": ["/*"],
    "html": ["-->"],
    "xml": ["-->"],
    "json": []
};

export const languageScopeEnd: { [language: string]: string[] } = {
    "c": ["}"],
    "cpp": ["}"],
    "csharp": ["}"],
    "python": ["'''", "class", "def"],
    "typescript": ["}"],
    "javascript": ["}"],
    "java": ["}"],
    "html": ["/>"],
    "xml": ["/>"],
    "json": ["}"]
};

export const languageScopeStart: { [language: string]: string[] } = {
    "c": ["{"],
    "cpp": ["{"],
    "csharp": ["{"],
    "python": [":"],
    "typescript": ["{"],
    "javascript": ["{"],
    "java": ["{"],
    "html": ["<"],
    "xml": ["<"],
    "json": ["{"]
};

export const isLanguageSupported = (languageId: string): boolean => {
    return languageScopeStart.hasOwnProperty(languageId);
};