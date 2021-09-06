import * as vscode from 'vscode';
import { CodexPrompt } from './codex-models';
import { isLanguageSupported, languageMultiLineComments, languageScopeEnd } from './language-utilities';
import { getProbableScope, getSameLevelScopes, getScopesAtPosition, getSignatureFromScope, scopeCategories } from './scope-utilities';

export const generateSimplePrompt = (document: vscode.TextDocument, position: vscode.Position, maxLength: number = 2048): CodexPrompt => {
    // TODO: dynamically generate stop sequence based on the scope and language
    let stopSequences = [...languageMultiLineComments[document.languageId], ...languageScopeEnd[document.languageId]];
    if (!stopSequences.length) {
        stopSequences = ["}", "end", "/*", "'''"];
    }

    // Add the line containing the cursor position
    let code = document.getText(new vscode.Range(new vscode.Position(position.line, 0), position));
    // Append previous lines until document start or code maxLength is reached
    for (let i = position.line - 1; i >= 0; i--) {
        const line = document.lineAt(i).text + "\n";
        code = line + code;
        if (code.length >= maxLength) {
            break;
        }
    }

    return { prompt: code, stopSequences };
};

export const generatePrompt = async (document: vscode.TextDocument, selections: vscode.Selection[]): Promise<CodexPrompt> => {

    // TODO: dynamically generate stop sequence based on the scope and language
    let stopSequences = [...languageMultiLineComments[document.languageId], ...languageScopeEnd[document.languageId]];
    if (!stopSequences.length) {
        stopSequences = ["}", "end", "/*", "'''"];
    }

    let prompt = "";

    const longSelections = selections.filter(s => !s.isEmpty);

    // If there are selections, use them as the prompt
    if (longSelections && longSelections.length) {
        prompt = `/**\n* Complete the following ${document.languageId} code:\n*/\n`;
        selections.sort((a, b) => a.start.line - b.start.line);
        // Append selection texts
        selections.forEach(selection => {
            prompt += `${document.getText(selection)}\n`;
        });
        prompt = prompt.trim();
    } else {

        if (!isLanguageSupported(document.languageId)) {
            return generateSimplePrompt(document, selections[0].end);
        }

        // Generate simplified code prompt
        const scopes: vscode.DocumentSymbol[] | undefined = await getScopesAtPosition(document, selections[0].end);

        if (!scopes || !scopes.length) {
            return generateSimplePrompt(document, selections[0].end);
        }

        const scope: vscode.DocumentSymbol | undefined = getProbableScope(scopes);
        if (!scope) {
            return generateSimplePrompt(document, selections[0].end);
        }

        if (scopeCategories[0].indexOf(scope.kind) !== -1) {
            const adjacentScopes: vscode.DocumentSymbol[] = getSameLevelScopes(scopes, scope) ?? [];

            if (adjacentScopes && adjacentScopes.length) {
                prompt += "/**\n* Given the signatures below\n";

                for (let adjScope of adjacentScopes) {
                    const signature = await getSignatureFromScope(document, adjScope);
                    if (!signature || !signature.length) {
                        continue;
                    }
                    prompt += `* ${signature}\n`;
                }
            }

            prompt += `* Complete the following ${document.languageId} code:\n*/\n`;
            prompt += document.getText(new vscode.Range(scope?.range.start ?? new vscode.Position(selections[0].end.line, 0), selections[0].end));

        } else {
            return generateSimplePrompt(document, selections[0].end);
        }
    }

    return { prompt, stopSequences };
};