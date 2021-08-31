// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { AxiosError } from "axios";
import { Console } from "console";
import * as vscode from "vscode";
import { CodexInlineCompletionItem } from "./CodexInlineCompletionItem";
import { simplifyDocument } from './simplified-document';

// Import axios
const axios = require("axios");

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log("vs-codex ON");

  const provider: vscode.InlineCompletionItemProvider<CodexInlineCompletionItem> =
  {
    provideInlineCompletionItems: async (
      document,
      position,
      context,
      token
    ) => {

      if (context.triggerKind !== vscode.InlineCompletionTriggerKind.Explicit) {
        return [];
      }

      const textBeforeCursor = document.getText(
        new vscode.Range(position.with(0, 0), position)
      );

      const textBeforeCursorSameline = document.getText(
        new vscode.Range(position.with(undefined, 0), position)
      );

      const suggestions: CodexInlineCompletionItem[] = [];

      const completions = await completeCode(textBeforeCursor);

      for (let i = 0; i < completions.length; i++) {
        suggestions.push({
          text: textBeforeCursorSameline + completions[i],
          trackingId: `Completion ${i}`,
          range: new vscode.Range(position.with(undefined, 0), position)
        });
      }

      console.log(suggestions);

      return suggestions;
    },
  };

  vscode.languages.registerInlineCompletionItemProvider({ pattern: "**" }, provider);

  // Be aware that the API around `getInlineCompletionItemController` will not be finalized as is!
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

  async function completeCode(code: string, choices = 1): Promise<string[]> {
    if (code.length < 5) {
      return [];
    }

    const codexURL =
      "https://api.openai.com/v1/engines/davinci-codex/completions";
    const prompt = "// Complete the code below:\r\n" + code;
    let response = await axios.post(
      codexURL,
      {
        prompt: prompt,
        temperature: 0.2,
        max_tokens: 256,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        n: choices,
        stop: ["}"]
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
      return [];
    }
    return response.data["choices"].map((c: any) => c["text"] + "}");
  }

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
        //await generateBriefCode(editor);
        // vscode.commands.executeCommand("editor.action.inlineSuggest.trigger");
        // VS code use provideDocumentSemanticTokens
        simplifyDocument(editor.document, editor.selection.end);        
      }
    }
  );


  context.subscriptions.push(disposable);
  context.subscriptions.push(disposableComplete);
}

// this method is called when your extension is deactivated
export function deactivate() { }
