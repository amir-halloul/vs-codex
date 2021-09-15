export enum CodexModel {
    davinci = "Davinci",
    cushman = "Cushman"
};

export class CodexConfig {
    model: CodexModel;
    choices: number;
    temperature: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
    bestOf: number;
    maxTokens: number;

    constructor(model: CodexModel, responseLength: number, temperature: number, topP: number, frequencyPenalty: number, presencePenalty: number, bestOf: number, maxTokens: number) {
        this.model = model;
        this.choices = responseLength;
        this.temperature = temperature;
        this.topP = topP;
        this.frequencyPenalty = frequencyPenalty;
        this.presencePenalty = presencePenalty;
        this.bestOf = bestOf;
        this.maxTokens = maxTokens;
    }
}

export class CodexPrompt {
    prompt: string;
    stopSequences: string[];

    constructor(prompt: string, stopSequences: string[]) {
        this.prompt = prompt;
        this.stopSequences = stopSequences;
    }
}