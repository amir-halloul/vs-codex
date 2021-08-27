// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// Import axios
const axios = require('axios');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('vs-codex ON');

	async function explainCode(code: string): Promise<string> {

		if (code.length === 0) {
			vscode.window.showWarningMessage("You must select the section of your code you want explained!");
			return "";
		}

		const codexUrl = "https://api.openai.com/v1/engines/davinci-codex/completions";
		const prompt = code + "\n/* Clear and brief explanation of the code above:";
		console.log(prompt);
		let response = await axios
			.post(codexUrl, {
				prompt: prompt,
				temperature: 0,
				max_tokens: 256,
				top_p: 1,
				frequency_penalty: 0,
				presence_penalty: 0,
				stop: ["*/"]
			}, {
				headers: {
					'Authorization': 'Bearer ' + vscode.workspace.getConfiguration("general").get("openaiKey"),
				}
			});

		if (response.data["choices"].length === 0) {
			vscode.window.showWarningMessage("No code returned by the server.");
			return "";
		}
		return response.data["choices"][0]["text"];
	}

	async function completeCode(code: string): Promise<string> {
		if (code.length < 5) {
			return "";
		}

		const codexURL = "https://api.openai.com/v1/engines/davinci-codex/completions";
		const prompt = "// Complete the code below:\r" + code;
		let response = await axios
			.post(codexURL, {
				prompt: prompt,
				temperature: 0.5,
				max_tokens: 256,
				top_p: 1,
				frequency_penalty: 0,
				presence_penalty: 0,
				stop: ["\n}"]
			}, {
				headers: {
					'Authorization': 'Bearer ' + vscode.workspace.getConfiguration("general").get("openaiKey"),
				}
			});

		if (response.data["choices"].length === 0) {
			return "";
		}
		return response.data["choices"][0]["text"];
	}

	let disposable = vscode.commands.registerCommand('vs-codex.explain', async function () {
		let editor = vscode.window.activeTextEditor;
		if (editor) {
			const document = editor.document;
			const selection = editor.selection;

			const selectedText = document.getText(selection);
			const explanation: string = await explainCode(selectedText);
			// TODO: find a way to display the explanation
		}
	});

	let disposableComplete = vscode.commands.registerCommand('vs-codex.complete', async function () {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const document = editor.document;
			const selection = editor.selection.active;

			const previousCode = document.getText(new vscode.Range(0, 0, selection.line, selection.character));
			console.log(previousCode);
			let completion = await completeCode(previousCode);
			console.log(completion);
			if (completion) {
				editor.edit(editBuilder => {
					editBuilder.insert(selection, completion);
				});
			} else {
				vscode.window.showWarningMessage("Unable to autocomplete message!");
			}
		}
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(disposableComplete);
}

// this method is called when your extension is deactivated
export function deactivate() { }
