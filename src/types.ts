const enum UserPresence {
    unknown = "unknown",
    available = "available",
    idle = "idle",
    doNotDisturb = "doNotDisturb",
    invisible = "invisible",
    offline = "offline"
}

interface User {
    id: string;
    name: string;
    imageUrl: string;
    smallImageUrl: string;
    presence: UserPresence;
    isBot?: boolean;
}

interface CurrentUser {
    id: string;
    name: string;
}

interface Users {
    [id: string]: User;
}

interface MessageAttachment {
    name: string;
    permalink: string;
}

interface MessageContent {
    author: string;
    authorIcon?: string;
    pretext: string;
    title: string;
    titleLink: string;
    text: string;
    footer: string;
    borderColor?: string;
}

interface MessageReaction {
    name: string;
    count: number;
    userIds: string[];
}

interface MessageReply {
    userId: string;
    timestamp: string;
    text?: string;
    attachment?: MessageAttachment;
}

interface MessageReplies {
    [timestamp: string]: MessageReply;
}

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


const enum MessageType {
    text = "text",
    thread_reply = "thread_reply",
    command = "command",
    link = "link",
    internal = "internal"
}

interface ExtensionMessage {
    type: MessageType;
    text: string;
}

interface UIMessage {
    fontFamily: string;
    fontSize: string;
    messages: Messages;
    users: Users;
    currentUser: CurrentUser;
    statusText: string;
}

interface UIMessageDateGroup {
    groups: UIMessageGroup[];
    date: string;
}

interface UIMessageGroup {
    messages: Message[];
    userId: string;
    user: User;
    minTimestamp: string;
    key: string;
}

interface ChatArgs {
    channelId?: string;
    user?: User;
    providerName: string;
    source: EventSource;
}

const enum EventSource {
    status = "status_item",
    command = "command_palette",
    activity = "activity_bar",
    info = "info_message",
    slash = "slash_command",
    vslsContacts = "vsls_contacts_panel",
    vslsStarted = "vsls_started"
}

const enum EventType {
    extensionInstalled = "extension_installed",
    viewOpened = "webview_opened",
    messageSent = "message_sent",
    vslsShared = "vsls_shared",
    vslsStarted = "vsls_started",
    vslsEnded = "vsls_ended",
    tokenConfigured = "token_configured",
    channelChanged = "channel_changed",
    authStarted = "auth_started",
    activationStarted = "activation_started",
    activationEnded = "activation_ended"
}

interface EventProperties {
    provider: string | undefined;
    source: EventSource | undefined;
}

interface TelemetryEvent {
    type: EventType;
    time: Date;
    properties: EventProperties;
}

interface ChatTreeNode {
    label: string;
    user: User | undefined;
    isCategory: boolean;
    presence: UserPresence;
    providerName: string;
}

type InitialState = {
    provider: string;
    teamId: string | undefined;
};
