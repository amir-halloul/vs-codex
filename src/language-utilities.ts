export const languageSingleLineComments: { [language: string]: string[] } = {
    "c": ["//"],
    "cpp": ["//"],
    "csharp": ["//"],
    "python": ["#"],
    "typescript": ["//"],
    "javascript": ["//"],
    "java": ["//"]
};

export const languageMultiLineComments: { [language: string]: string[] } = {
    "c": ["/*"],
    "cpp": ["/*"],
    "csharp": ["/*"],
    "python": ["'''"],
    "typescript": ["/*"],
    "javascript": ["/*"],
    "java": ["/*"]
};

export const languageScopeEnd: { [language: string]: string[] } = {
    "c": ["}"],
    "cpp": ["}"],
    "csharp": ["}"],
    "python": ["'''"],
    "typescript": ["}"],
    "javascript": ["}"],
    "java": ["}"]
};

export const languageScopeStart: { [language: string]: string[] } = {
    "c": ["{"],
    "cpp": ["{"],
    "csharp": ["{"],
    "python": [":"],
    "typescript": ["{"],
    "javascript": ["{"],
    "java": ["{"]
};

export const isLanguageSupported = (languageId: string): boolean => {
    return languageScopeStart.hasOwnProperty(languageId);
};