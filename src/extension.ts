import { AxiosError } from "axios";
import * as vscode from "vscode";
import { CodexPrompt } from "./codex-models";
import { CodexInlineCompletionItem } from "./CodexInlineCompletionItem";
import { generatePrompt } from "./prompt-utilities";

// Import axios
const axios = require("axios");

export function activate(context: vscode.ExtensionContext) {

  // Status Bar Item
  let completionTypeStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000);
	completionTypeStatusBarItem.command = "vs-codex.change-completion-type";
  updateCompletionTypeStatusBarItem();

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
      const prompt = await generatePrompt(document, vscode.window.activeTextEditor?.selections ?? []);

      console.log("Creating file");
      // Create a virtual document containing the prompt data and display it
      const vdoc = await vscode.workspace.openTextDocument(
        {
          language: "text",
          content: "Prompt:\n" + prompt.prompt
        });

      const completions = await completeCode(prompt);

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
    if (code.length === 0) {
      vscode.window.showWarningMessage(
        "You must select the section of your code you want explained!"
      );
      return "";
    }

    const codexUrl =
      "https://api.openai.com/v1/engines/davinci-codex/completions";
    const prompt = code + "\n/* Clear and brief explanation of the code above:";
    console.log(prompt);
    let response = await axios.post(
      codexUrl,
      {
        prompt: prompt,
        temperature: 0.9,
        max_tokens: 256,
        top_p: 1,
        frequency_penalty: 0.2,
        presence_penalty: 0,
        stop: ["*/"],
      },
      {
        headers: {
          Authorization:
            "Bearer " +
            vscode.workspace.getConfiguration("general").get("openaiKey"),
        },
      }
    );

    if (response.data["choices"].length === 0) {
      vscode.window.showWarningMessage("No code returned by the server.");
      return "";
    }
    return response.data["choices"][0]["text"];
  }

  async function completeCode(prompt: CodexPrompt, choices = 1): Promise<string[]> {
    if (prompt.prompt.length < 5) {
      vscode.window.showErrorMessage("The sample code is too short to give anything meaningful!");
      return [];
    }

    vscode.window.showInformationMessage("Generating code completion...");

    const codexURL =
      "https://api.openai.com/v1/engines/davinci-codex/completions";
    let response = await axios.post(
      codexURL,
      {
        prompt: prompt.prompt,
        temperature: 0.2,
        max_tokens: 256,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        n: choices,
        stop: prompt.stopSequences
      },
      {
        headers: {
          Authorization:
            "Bearer " +
            vscode.workspace.getConfiguration("general").get("openaiKey"),
        },
      }
    ).catch((error: AxiosError | Error) => {
      if (axios.isAxiosError(error)) {
        vscode.window.showErrorMessage("Authorization error occured while generating suggestions.\nMake sure you set your OpenAI API key in the configurations.")
        return;
      }
      vscode.window.showErrorMessage("Unexpected error occured while generating suggestions");
    });
    if (response.data["choices"].length === 0) {
      vscode.window.showErrorMessage("Could not generate code completion.");
      return [];
    }
    return response.data["choices"].map((c: any) => c["text"]);
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
      let choice = await vscode.window.showQuickPick(["Line", "Function", "File"],
        { placeHolder: "Select completion type:" });
      if (choice) {
        context.globalState.update("COMPLETION-TYPE", choice);
        updateCompletionTypeStatusBarItem();
      }
    }
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(disposableComplete);
  context.subscriptions.push(disposableChangeCompletionType);
  context.subscriptions.push(completionTypeStatusBarItem);

  function updateCompletionTypeStatusBarItem(): void {
    const completionType = context.globalState.get<string>("COMPLETION-TYPE");
    completionTypeStatusBarItem.name = `$(megaphone) Completion type: ${completionType}`;
    completionTypeStatusBarItem.show();
    console.log("Showing bar: " + completionTypeStatusBarItem.name);
  }
}

// this method is called when your extension is deactivated
export function deactivate() { }
