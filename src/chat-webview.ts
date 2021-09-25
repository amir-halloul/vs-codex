import * as vscode from "vscode";
import * as path from "path";

const SAME_GROUP_TIME = 5 * 60; // seconds

export class ChatWebview {
  panel: vscode.WebviewPanel;
  imagesUri: vscode.Uri;

  constructor(
    extensionPath: string,
    private onDidDispose: () => void,
    private onDidChangeViewState: (isVisible: Boolean) => void
  ) {
    const imagesPath = path.join(extensionPath, "images");
    const baseVuePath = path.join(extensionPath, "chat/static");
    const staticPath = vscode.Uri.file(baseVuePath).with({
      scheme: "vscode-resource"
    });

    this.panel = vscode.window.createWebviewPanel(
      "code-chat",
      "VS-Code Chat",
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.file(baseVuePath), vscode.Uri.file(imagesPath)]
      }
    );

    this.imagesUri = this.getWebviewUri(vscode.Uri.file(imagesPath));

    this.panel.webview.html = getWebviewContent(staticPath.toString());

    // Handle on did dispose for webview panel
    this.panel.onDidDispose(() => this.onDidDispose());

    // Handle tab switching event
    this.panel.onDidChangeViewState(event => {
      const { visible } = event.webviewPanel;
      this.onDidChangeViewState(visible);
    });
  }

  setMessageHandler(msgHandler: (message: ExtensionMessage) => void) {
    this.panel.webview.onDidReceiveMessage((message: ExtensionMessage) =>
      msgHandler(message)
    );
  }

  update(uiMessage: UIMessage) {
    const { messages, users } = uiMessage;
    const groups = this.getMessageGroups(messages, users);
    this.panel.webview.postMessage({ ...uiMessage, messages: groups });
  }

  reveal() {
    this.panel.reveal();
  }

  getMessageGroups(input: Messages, users: Users): UIMessageDateGroup[] {
    let result: { [date: string]: Messages } = {};

    Object.keys(input).forEach(ts => {
      console.log(ts);
      const date = new Date(+ts * 1000);
      const dateStr = toDateString(date);
      if (!(dateStr in result)) {
        result[dateStr] = {};
      }
      result[dateStr][ts] = input[ts];
    });

    return Object.keys(result)
      .sort((a, b) => a.localeCompare(b))
      .map(date => {
        const messages = result[date];
        const groups = this.getMessageGroupsForDate(messages, users);
        return {
          groups,
          date
        };
      });
  }

  getMessageGroupsForDate(
    input: Messages,
    users: Users
  ): UIMessageGroup[] {
    const timestamps = Object.keys(input).sort((a, b) => +a - +b); // ascending

    const initial = {
      current: {},
      groups: []
    };

    const result = timestamps.reduce((accumulator: any, ts) => {
      const { current, groups } = accumulator;
      const message = input[ts];
      const isSameUser = current.userId
        ? message.userId === current.userId
        : false;
      const isSameTime = current.ts
        ? +ts - +current.ts < SAME_GROUP_TIME
        : false;

      if (isSameUser && isSameTime) {
        return {
          groups,
          current: {
            ...current,
            ts,
            messages: [...current.messages, message]
          }
        };
      } else {
        const currentGroup = {
          messages: [message],
          userId: message.userId,
          user: users[message.userId],
          minTimestamp: ts,
          ts,
          key: ts
        };
        return {
          groups: current.ts ? [...groups, current] : [...groups],
          current: currentGroup
        };
      }
    }, initial);

    const { current, groups } = result;
    return current.ts ? [...groups, current] : groups;
  }

  isVisible() {
    return this.panel.visible;
  }

  private getWebviewUri(uri: vscode.Uri): vscode.Uri {
    return this.panel.webview.asWebviewUri(uri);
  }
}



function getWebviewContent(staticPath: string) {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" 
        content="default-src * vscode-resource: https: 'unsafe-inline' 'unsafe-eval';
        script-src vscode-resource: blob: data: https: 'unsafe-inline' 'unsafe-eval';
        style-src vscode-resource: https: 'unsafe-inline';
        img-src vscode-resource: data: https:;
        connect-src vscode-resource: blob: data: https: http:;">
      <title>Chat</title>
      <link href="${staticPath}/css/app.css" rel="preload" as="style">
      <link href="${staticPath}/js/chunk-vendors.js" rel="preload" as="script">
      <link href="${staticPath}/js/app.js" rel="preload" as="script">
      <link href="${staticPath}/css/app.css" rel="stylesheet">
  </head>
  <body>
      <div id="app"> </div>
      <script src="${staticPath}/js/chunk-vendors.js"> </script>
      <script src="${staticPath}/js/app.js"> </script>
  </body>
  </html>`;
}

function toDateString(date: Date) {
  // Returns ISO-format date string for a given date
  let month = (date.getMonth() + 1).toString();
  let day = date.getDate().toString();

  if (month.length === 1) {
    month = `0${month}`;
  }

  if (day.length === 1) {
    day = `0${day}`;
  }

  return `${date.getFullYear()}-${month}-${day}`;
}

export function camelCaseToTitle(text: string) {
  var result = text.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1);
}

export function titleCaseToCamel(text: string) {
  var result = text.replace(/ /g, "");
  return result.charAt(0).toLowerCase() + result.slice(1);
}