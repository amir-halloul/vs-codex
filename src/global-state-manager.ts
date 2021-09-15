import * as vscode from "vscode";
import { CodexModel } from "./models/codex-models";

const COMPLETION_TYPE = "COMPLETION_TYPE";
const CODEX_MODEL = "CODEX_MODEL";

export enum CompletionType {
    line = "Line",
    scope = "Scope",
    unrestricted = "Unrestricted"
}

export const setCompletionType = (context: vscode.ExtensionContext, completionType: CompletionType): void => {
    context.globalState.update(COMPLETION_TYPE, completionType);
};

export const getCompletionType = (context: vscode.ExtensionContext): CompletionType => {
    return context.globalState.get<CompletionType>(COMPLETION_TYPE) ?? CompletionType.line;
};

export const setCodexModel = (context: vscode.ExtensionContext, codexModel: CodexModel): void => {
    context.globalState.update(CODEX_MODEL, codexModel);
};

export const getCodexModel = (context: vscode.ExtensionContext): CodexModel => {
    return context.globalState.get<CodexModel>(CODEX_MODEL) ?? CodexModel.davinci;
};