import { CodexPrompt } from "../models/codex-models";

interface Message {
    timestamp: string;
    userId: string;
    text: string;
    isEdited?: Boolean;
    attachment?: MessageAttachment;
    content: MessageContent | undefined;
    reactions: MessageReaction[];
    replies: MessageReplies;
}

interface Messages {
    [timestamp: string]: Message;
}

export const BOT_USER_ID = "1";
export const CURRENT_USER_ID = "2";

export const generateChatPrompt = (messages: Messages, language: string): CodexPrompt => {
    const desc = `You are an expert programmer. You are the assistant of a developer. You answer their questions, give them code snippets and useful tips and tricks. You can answer and solve complex problems. The developer is currently writing ${language} code\n`;
    let prompt = desc;
    // Iterate over all messages 
    // If a message was sent by BOT_USER_ID append 'you: ' infront of the message otherwise append 'developer: '
    for (const timestamp in messages) {
        const message = messages[timestamp];
        if (message.userId === BOT_USER_ID) {
            prompt += `you: ${message.text}\n`;
        } else {
            prompt += `developer: ${message.text}\n`;
        }
    }
    return { prompt: `${prompt}you:`, stopSequences: ["you:", "developer:"] };
};