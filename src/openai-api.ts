import axios from "axios";
import { CodexConfig, CodexModel, CodexPrompt } from "./models/codex-models";

export const getModelUrl = (model: CodexModel): string => {
    switch (model) {
        case CodexModel.davinci:
            return "https://api.openai.com/v1/engines/davinci-codex/completions";
        case CodexModel.cushman:
            return "https://api.openai.com/v1/engines/cushman-codex/completions";
    }
};

// TODO: properly handle errors
export const predictNext = async (prompt: CodexPrompt, config: CodexConfig, authToken: string): Promise<string[] | undefined> => {
    const endpoint = getModelUrl(config.model);
    const tokens: string[] | void | undefined = await axios.post(endpoint, {
        prompt: prompt.prompt,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        top_p: config.topP,
        frequency_penalty: config.frequencyPenalty,
        presence_penalty: config.presencePenalty,
        stop: prompt.stopSequences.length ? prompt.stopSequences : null,
        n: config.choices
    }, {
        headers: {
            Authorization: "Bearer " + authToken
        }
    }).then(response => {
        console.log(response.data);
        return response?.data["choices"].map((choice: any) => choice["text"]);
    }).catch(reason => undefined);

    return tokens ?? undefined;
};