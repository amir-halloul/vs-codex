import { InlineCompletionItem } from 'vscode';

export interface CodexInlineCompletionItem extends InlineCompletionItem {
  trackingId: string;
}
