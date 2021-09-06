import * as vscode from 'vscode';

export const scopeCategories: { [priority: number]: vscode.SymbolKind[] } = {
    0: [vscode.SymbolKind.Method, vscode.SymbolKind.Function, vscode.SymbolKind.Constructor, vscode.SymbolKind.Enum],
    1: [vscode.SymbolKind.Class, vscode.SymbolKind.Interface, vscode.SymbolKind.Struct],
    2: [vscode.SymbolKind.Module, vscode.SymbolKind.Package, vscode.SymbolKind.Namespace]
};

/**
 * Creats a sorted array of nested symbols containing a given position
 * @param document 
 * @param position 
 * @returns 
 */
export const getScopesAtPosition = async (document: vscode.TextDocument, position: vscode.Position): Promise<vscode.DocumentSymbol[] | undefined> => {

    // Extract document symbols
    const symbols: vscode.DocumentSymbol[] = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>("vscode.executeDocumentSymbolProvider", document.uri) ?? [];
    // Find the symbol at the cursor position
    let rootSymbol: vscode.DocumentSymbol | undefined = symbols.find(symbol => {
        return symbol.range.contains(position);
    });

    if (!rootSymbol) {
        return undefined;
    }

    const foundSymbols = [rootSymbol];

    while (rootSymbol?.children.length) {
        const symbol: vscode.DocumentSymbol | undefined = rootSymbol.children.find(symbol => {
            return symbol.range.contains(position);
        });

        if (!symbol) {
            break;
        }

        rootSymbol = symbol;
        foundSymbols.push(symbol);
    }

    return foundSymbols;
};

/**
 * Get the scope possibly containing the most relevant code from a list of symbols where the target code
 * is in the last symbol of the array
 * @param scopes
 */
export const getProbableScope = (scopes: vscode.DocumentSymbol[]): vscode.DocumentSymbol | undefined => {

    if (!scopes || !scopes.length) {
        return undefined;
    }

    let classLevel: vscode.DocumentSymbol | undefined = undefined;
    let moduleLevel: vscode.DocumentSymbol | undefined = undefined;

    for (let i = scopes.length - 1; i >= 0; i--) {
        if (scopeCategories[0].indexOf(scopes[i].kind) !== -1) {
            return scopes[i];
        }

        if (!classLevel && scopeCategories[1].indexOf(scopes[i].kind) !== -1) {
            classLevel = scopes[i];
        }

        if (!moduleLevel && scopeCategories[2].indexOf(scopes[i].kind) !== -1) {
            moduleLevel = scopes[i];
        }
    }

    return classLevel ?? moduleLevel;
};

/**
 * Returns an array of scopes with the same nesting level as scope
 * @param scopes 
 * @param scope 
 */
export const getSameLevelScopes = (scopes: vscode.DocumentSymbol[], scope: vscode.DocumentSymbol | undefined): vscode.DocumentSymbol[] | undefined => {
    if (!scopes || !scopes.length || !scope) {
        return undefined;
    }

    for (let i = scopes.length - 1; i >= 0; i--) {
        if (scopes[i] === scope) {
            if (i === 0) {
                return undefined;
            }

            return scopes[i - 1].children.filter(s => s !== scope);
        }
    }

    return undefined;
};

/**
 * Returns the signature of a given DocumentSymbol
 * @param scope 
 */
export const getSignatureFromScope = async (document: vscode.TextDocument, scope: vscode.DocumentSymbol | undefined): Promise<string | undefined> => {
    if (!scope) {
        return undefined;
    }
    const hoverData: vscode.Hover[] = await vscode.commands.executeCommand<vscode.Hover[]>("vscode.executeHoverProvider", document.uri, scope?.selectionRange.start.translate(0, 1)) ?? [];
    const hoverDataText = hoverData.map(data => {
        let text = undefined;
        for (let c of data.contents) {
            text = (c as vscode.MarkdownString).value.trim();
            if (text.startsWith('```' + document.languageId)) {
                break;
            }
        }
        const signatureParts: string[] = text?.split("\n") ?? [];
        
        if (signatureParts.length < 2) {
            return undefined;
        }
        return signatureParts[1].replace('(loading...)', '').trim();
    });

    if (!hoverDataText || !hoverDataText.length) {
        return undefined;
    }

    return hoverDataText[0];
};