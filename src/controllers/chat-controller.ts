import * as vscode from "vscode";
import { ChatWebview } from "../chat-webview";
import { CodexConfig, CodexModel } from "../models/codex-models";
import { predictNext } from "../openai-api";
import { BOT_USER_ID, CURRENT_USER_ID, generateChatPrompt } from "../utilities/chat-utilities";

export class ChatController {

    private _chatWebview: ChatWebview;
    private _extensionUri: vscode.Uri;
    private _documentLanguage: string;
    private messages: Messages = {};
    private individualUsers: User[] = [
        {
            id: BOT_USER_ID,
            name: "Bot",
            imageUrl: "openai-icon.png",
            presence: UserPresence.doNotDisturb,
            smallImageUrl: "openai-icon.png",
            isBot: true
        },
        {
            id: CURRENT_USER_ID,
            name: "You",
            imageUrl: "you.jpg",
            presence: UserPresence.doNotDisturb,
            smallImageUrl: "you.jpg",
            isBot: false
        }
    ];  
    private currentUser: CurrentUser = { id: CURRENT_USER_ID, name: this.individualUsers[1].name };
    private users: Users = {};

    constructor(private extensionUri: vscode.Uri, private language: string) {
        this._extensionUri = extensionUri;
        this._documentLanguage = language;
        this._chatWebview = new ChatWebview(this._extensionUri.fsPath, this.handleDispose, this.handleViewStateChange);
        this._chatWebview.setMessageHandler(this.handleMessages.bind(this));
        this.individualUsers.forEach(user => {
            user.imageUrl = user.smallImageUrl = `${this._chatWebview.imagesUri}/${user.imageUrl}`;
            this.users[user.id] = user;
        });
        this.addMessage("Hello. How can I help you today?", BOT_USER_ID); 
    }

    private addMessage(text: string, userId: string) {
        const timestamp = Date.now() / 1000;
        this.messages[timestamp.toString()] = {
            content: undefined,
            text: text,
            userId: userId,
            reactions: [],
            replies: {},
            timestamp: timestamp.toString()
        };
        this.update();
    }

    private handleMessages(message: ExtensionMessage) {
        if (message.type === MessageType.text) {
            // Add typed message to list
            this.addMessage(message.text, CURRENT_USER_ID);
            this.generateBotResponse();
        } 
    }

    private async generateBotResponse() {
        // Generate response
        const prompt = generateChatPrompt(this.messages, this._documentLanguage);
        console.log(prompt);
        const config: CodexConfig = {
            model: CodexModel.davinci,
            temperature: 0.5,
            maxTokens: 256,
            topP: 1,
            frequencyPenalty: 1,
            presencePenalty: 1,
            bestOf: 1,
            choices: 1
        };
        const completions = await predictNext(prompt, config, vscode.workspace.getConfiguration("general").get("openaiKey") ?? "");
        if (completions && completions.length) {
            // Add bot response to message list
            this.addMessage(completions[0], BOT_USER_ID);
        }
    }

    private update() {
        this._chatWebview.update({
            fontFamily: "monospace",
            fontSize: "12px",
            messages: this.messages,
            statusText: "",
            currentUser: this.currentUser,
            users: this.users
        });
    }

    private handleDispose() { }

    private handleViewStateChange() { }
}