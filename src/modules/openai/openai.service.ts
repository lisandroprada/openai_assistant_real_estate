import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

@Injectable()
export class OpenaiService {
  private openai: OpenAI;
  private systemMessage: ChatCompletionMessageParam;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });

    this.systemMessage = {
      role: 'system',
      content:
        'Eres un asistente virtual amigable, serio y considerado de Propietas Inmobiliaria. Tu objetivo es ayudar a los clientes a encontrar propiedades para comprar o alquilar. Siempre busca la información necesaria del cliente antes de realizar búsquedas en la API. Si no tienes suficiente información, pide aclaraciones de manera amena y profesional.',
    };
  }

  async getChatCompletion(
    messages: ChatCompletionMessageParam[],
    tools?: any[],
  ) {
    const messagesWithSystemPrompt = [this.systemMessage, ...messages];
    const chatCompletion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini', // Or another suitable model
      messages: messagesWithSystemPrompt,
      tools: tools,
      tool_choice: tools ? 'auto' : undefined,
    });
    return chatCompletion.choices[0].message;
  }
}
