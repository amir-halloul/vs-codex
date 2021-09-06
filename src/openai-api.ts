import axios from "axios";
import { CodexConfig, CodexModel, CodexPrompt } from "./codex-models";

export const getModelUrl = (model: CodexModel): string => {
    switch (model) {
        case CodexModel.Davinci:
            return "https://api.openai.com/v1/engines/davinci-codex/completions";
        case CodexModel.Cushman:
            return "https://api.openai.com/v1/engines/cushman-codex/completions";
    }
};

export const predictNext = async (prompt: CodexPrompt, config: CodexConfig, authToken: string): Promise<string | undefined> => {
    const endpoint = getModelUrl(config.model);
    const token: string | void | undefined = await axios.post(endpoint, {
        prompt: prompt.prompt,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        top_p: config.topP,
        frequency_penalty: config.frequencyPenalty,
        presence_penalty: config.presencePenalty,
        stop: prompt.stopSequences,
    }, {
        headers: {
            Authorization: "Bearer " + authToken
        }
    }).then(response => {
        response?.data["choices"][0]["text"] ?? undefined;
    }).catch(reason => undefined);

    return token ?? undefined;
};