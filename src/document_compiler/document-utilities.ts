import * as vscode from 'vscode';

export const languageImportKeywords: { [languageId: string]: string[] } = {
    "c": ["#include"],
    "cpp": ["#include"],
    "csharp": ["using"],
    "java": ["import"],
    "javascript": ["import"],
    "python": ["import", "from"],
    "typescript": ["import"],
};


export function getLanguageImportLines(document: vscode.TextDocument): vscode.Range[] {
    const ranges: vscode.Range[] = [];

    const keywords = languageImportKeywords[document.languageId];
    if (!keywords || !keywords.length) {
        return [];
    }

    // Iterate over document lines
    for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i);
        const text = line.text;

        // Iterate over keywords
        for (const keyword of keywords) {
            const index = text.indexOf(keyword);
            if (index >= 0) {
                ranges.push(line.range);
            }
        }
    }
    return ranges;
}