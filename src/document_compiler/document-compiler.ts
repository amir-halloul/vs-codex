import * as vscode from 'vscode';
import { getLanguageImportLines } from './document-utilities';

export function compileDocument(document: vscode.TextDocument): string {
    const imports: vscode.Range[] = getLanguageImportLines(document);
    let compiledDocument: string = "";
    // Print text from
    imports.forEach(importRange => {
        compiledDocument += document.getText(importRange) + "\n";
    });
    return compiledDocument.length ? compiledDocument : document.getText();
}