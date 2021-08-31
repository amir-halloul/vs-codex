import * as vscode from 'vscode';

const scopePriorities: { [priority: number]: vscode.SymbolKind[] } = {
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

    console.log(symbols);
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
 * returns a string containing code at the most reasonable scope that contains the given position
 * @param document 
 * @param position 
 * @param scopes
 */
export const getProbableScopeText = async (document: vscode.TextDocument, position: vscode.Position, scopes: vscode.DocumentSymbol[]): Promise<string | undefined> => {

    if (!scopes || !scopes.length) {
        return undefined;
    }

    for (let i = scopes.length - 1; i >= 0; i--) {
        if (scopePriorities[0].indexOf(scopes[i].kind) !== -1) {
            return document.getText(scopes[i].range);
        }
    }

    return undefined;
};

/**
 * Simplifies a document around a given position 
 * @param document 
 * @param position 
 * @returns 
 */
export const simplifyDocument = async (document: vscode.TextDocument, position: vscode.Position): Promise<string | undefined> => {

    const scopes: vscode.DocumentSymbol[] | undefined = await getScopesAtPosition(document, position);

    if (!scopes || !scopes.length) {
        return undefined;
    }

    const scopeText: string | undefined = await getProbableScopeText(document, position, scopes);

    console.log("Detected scope text: ");
    console.log(scopeText);

    return undefined;
}