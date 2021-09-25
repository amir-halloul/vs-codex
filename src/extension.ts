import * as vscode from "vscode";
import { CodexConfig, CodexModel, CodexPrompt } from "./models/codex-models";
import { CodexInlineCompletionItem } from "./models/codex-inline-completion-item-model";
import { generatePrompt } from "./utilities/prompt-utilities";
import { CompletionType, getCodexModel, getCompletionType, setCodexModel, setCompletionType } from "./global-state-manager";
import { predictNext } from "./openai-api";
import { ChatController } from "./controllers/chat-controller";

export function activate(extensionContext: vscode.ExtensionContext) {

  // Status Bar Item
  let codexStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  codexStatusBarItem.name = `VS Codex`;
  codexStatusBarItem.command = "vs-codex.change-completion-type";
  updateCodexStatusBarItem();

  // Inline Completions Provider
  const provider: vscode.InlineCompletionItemProvider<CodexInlineCompletionItem> =
  {
    provideInlineCompletionItems: async (
      document,
      position,
      context,
      token
    ) => {

      // Only autocomplete when explicitly requested to reduce model usage
      if (context.triggerKind !== vscode.InlineCompletionTriggerKind.Explicit) {
        return [];
      }

      // Get the text on the same line where the autocompletion was requested
      const autoCompletionLine = document.getText(
        new vscode.Range(position.with(undefined, 0), position)
      );

      const suggestions: CodexInlineCompletionItem[] = [];

      // Generate the appropriate prompt
      const prompt = await generatePrompt(document, vscode.window.activeTextEditor?.selections ?? [], getCompletionType(extensionContext));

      const completions = await completeCode(prompt, vscode.workspace.getConfiguration("model").get<number>("n") ?? 1);

      if (!completions || !completions.length) {
        return undefined;
      }

      for (let i = 0; i < completions.length; i++) {
        suggestions.push({
          text: autoCompletionLine + completions[i],
          trackingId: `Completion ${i}`,
          range: new vscode.Range(position.with(undefined, 0), position)
        });
      }

      return suggestions;
    },
  };

  vscode.languages.registerInlineCompletionItemProvider({ pattern: "**" }, provider);
  vscode.window.getInlineCompletionItemController(provider).onDidShowCompletionItem(e => {
    const id = e.completionItem.trackingId;
  });


  async function explainCode(code: string): Promise<string> {
    vscode.window.showWarningMessage("This feature is not yet developed");
    return "";
  }

  async function completeCode(prompt: CodexPrompt, choices = 1): Promise<string[] | undefined> {
    if (prompt.prompt.length < 5) {
      vscode.window.showErrorMessage("The sample code is too short to give anything meaningful!");
      return [];
    }

    vscode.window.showInformationMessage("Generating code completion...");

    // TODO: Create a configuration utility
    const config: CodexConfig = {
      model: getCodexModel(extensionContext),
      temperature: vscode.workspace.getConfiguration("model").get<number>("temperature") ?? 0.2,
      maxTokens: vscode.workspace.getConfiguration("general").get<number>("maxTokens") ?? 256,
      topP: vscode.workspace.getConfiguration("model").get<number>("topP") ?? 0.2,
      frequencyPenalty: vscode.workspace.getConfiguration("model").get<number>("frequencyPenalty") ?? 0,
      presencePenalty: vscode.workspace.getConfiguration("model").get<number>("presencePenalty") ?? 0,
      bestOf: vscode.workspace.getConfiguration("model").get<number>("bestOf") ?? 1,
      choices
    };

    const completions = await predictNext(prompt, config, vscode.workspace.getConfiguration("general").get("openaiKey") ?? "");

    if (!completions || !completions.length) {
      vscode.window.showErrorMessage("Could not generate code completion.");
    }

    return completions;
  }


  // Commands
  let disposable = vscode.commands.registerCommand(
    "vs-codex.explain",
    async function () {
      let editor = vscode.window.activeTextEditor;
      if (editor) {
        const document = editor.document;
        const selection = editor.selection;

        const selectedText = document.getText(selection);
        const explanation: string = await explainCode(selectedText);
        // TODO: find a way to display the explanation
      }
    }
  );

  let disposableComplete = vscode.commands.registerCommand(
    "vs-codex.complete",
    async function () {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        vscode.commands.executeCommand("editor.action.inlineSuggest.trigger");
      }
    }
  );

  let disposableChangeCompletionType = vscode.commands.registerCommand(
    "vs-codex.change-completion-type",
    async function () {
      let choice: string = await vscode.window.showQuickPick(Object.values(CompletionType),
        { placeHolder: "Select completion type:" }) ?? CompletionType.line;
      if (choice) {
        setCompletionType(extensionContext, <CompletionType>choice);
        updateCodexStatusBarItem();
      }
    }
  );

  let disposableChangeModelType = vscode.commands.registerCommand(
    "vs-codex.change-model-type",
    async function () {
      let choice: string = await vscode.window.showQuickPick(Object.values(CodexModel),
        { placeHolder: "Select Codex model:" }) ?? CodexModel.davinci;
      if (choice) {
        setCodexModel(extensionContext, <CodexModel>choice);
        updateCodexStatusBarItem();
      }
    }
  );

  let disposableChat = vscode.commands.registerCommand(
    "vs-codex.chat",
    async function () {
      let editor = vscode.window.activeTextEditor;
      if (editor) {
        const chatController = new ChatController(extensionContext.extensionUri, editor.document.languageId);
      }
    }
  );

  extensionContext.subscriptions.push(disposable);
  extensionContext.subscriptions.push(disposableComplete);
  extensionContext.subscriptions.push(disposableChangeCompletionType);
  extensionContext.subscriptions.push(codexStatusBarItem);
  extensionContext.subscriptions.push(disposableChangeModelType);
  extensionContext.subscriptions.push(disposableChat);

  function updateCodexStatusBarItem(): void {
    const completionType = getCompletionType(extensionContext);
    const modelType = getCodexModel(extensionContext);
    codexStatusBarItem.text = `VS Codex ${modelType}: ${completionType}`;
    codexStatusBarItem.show();
  }
}

export function deactivate() { }
