import Anthropic from '@anthropic-ai/sdk';
import { config } from './index';

const anthropic = new Anthropic({
    apiKey: config.anthropicApiKey,
});

export default anthropic;
