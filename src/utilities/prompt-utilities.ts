import * as vscode from 'vscode';
import { CompletionType } from '../global-state-manager';
import { CodexPrompt } from '../models/codex-models';
import { isLanguageSupported, languageScopeEnd } from './language-utilities';
import { getProbableScope, getSameLevelScopes, getScopesAtPosition, getSignatureFromScope, scopeCategories } from './scope-utilities';

// TODO: needs to be improved
export const generateStopSequence = (languageId: string, completionType: CompletionType): string[] => {
    switch (completionType) {
        case CompletionType.line:
            return ['\n'];
        case CompletionType.scope:
            if (!isLanguageSupported(languageId)) {
                return ["}", ">", "]", "end"];
            }
            return languageScopeEnd[languageId];
        case CompletionType.unrestricted:
            return [];
    }
};

export const generateSimplePrompt = (document: vscode.TextDocument, position: vscode.Position, completionType: CompletionType, maxLength: number = 2048): CodexPrompt => {

    let stopSequences = generateStopSequence(document.languageId, completionType);

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

// TODO: needs more research
export const generatePrompt = async (document: vscode.TextDocument, selections: vscode.Selection[], completionType: CompletionType): Promise<CodexPrompt> => {

    let stopSequences = generateStopSequence(document.languageId, completionType);

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
            return generateSimplePrompt(document, selections[0].end, completionType);
        }

        // Generate simplified code prompt
        const scopes: vscode.DocumentSymbol[] | undefined = await getScopesAtPosition(document, selections[0].end);

        if (!scopes || !scopes.length) {
            return generateSimplePrompt(document, selections[0].end, completionType);
        }

        const scope: vscode.DocumentSymbol | undefined = getProbableScope(scopes);
        if (!scope) {
            return generateSimplePrompt(document, selections[0].end, completionType);
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
            return generateSimplePrompt(document, selections[0].end, completionType);
        }
    }

    return { prompt, stopSequences };
};