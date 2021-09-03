import * as vscode from 'vscode';

export const generatePrompt = (document: vscode.TextDocument, selections: vscode.Selection[]) => {

    let prompt = "";

    // If there are selections, use them as prompts
    if (selections && selections.length) {
        prompt = "/**\n* Complete the following code:\n";
    }
};