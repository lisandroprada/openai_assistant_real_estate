import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Thread } from './schemas/thread.schema';
import { Message } from './schemas/message.schema';
import { OpenaiService } from '../openai/openai.service';
import { FunctionsService } from '../functions/functions.service';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { ChatCompletionMessage } from 'openai/resources/chat';

@Injectable()
export class ThreadsService {
  constructor(
    @InjectModel(Thread.name) private threadModel: Model<Thread>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    private openaiService: OpenaiService,
    private functionsService: FunctionsService,
  ) {}

  async createThread(userId: string): Promise<Thread> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14); // 14 days expiration
    const newThread = new this.threadModel({ userId, expiresAt });
    return newThread.save();
  }

  async findAll(): Promise<Thread[]> {
    return this.threadModel.find().exec();
  }

  async getThreadMessages(threadId: string): Promise<Message[]> {
    const thread = await this.threadModel
      .findById(threadId)
      .populate('messages')
      .exec();
    return thread ? (thread.messages as unknown as Message[]) : [];
  }

  async addMessageToThread(
    threadId: string,
    userContent: string,
  ): Promise<Message> {
    // Save user message
    const userMessage = new this.messageModel({
      threadId,
      role: 'user',
      content: userContent,
    });
    await userMessage.save();
    await this.threadModel
      .findByIdAndUpdate(threadId, { $push: { messages: userMessage._id } })
      .exec();

    // Get conversation history
    const thread = await this.threadModel
      .findById(threadId)
      .populate('messages')
      .exec();

    if (!thread) {
      throw new NotFoundException(`Thread with ID ${threadId} not found`);
    }

    const messages: ChatCompletionMessageParam[] = (
      thread.messages as unknown as Message[]
    ).map((msg: Message) => {
      if (msg.role === 'tool') {
        return {
          role: 'tool',
          tool_call_id: (msg as any).tool_call_id || '', // Assuming tool_call_id is stored in Message if role is tool
          content: msg.content,
        };
      } else if (msg.role === 'assistant' && msg.functionCall) {
        return {
          role: 'assistant',
          content: msg.content,
          function_call: {
            name: msg.functionCall.name,
            arguments: JSON.stringify(msg.functionCall.arguments),
          },
        };
      } else {
        return {
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        };
      }
    });

    // Define available tools (from GEMINI.md example)
    const tools = [
      {
        type: 'function',
        function: {
          name: 'searchProperties',
          description:
            'Busca propiedades disponibles para venta o alquiler con varios filtros. Puedes filtrar por tipo de propiedad (departamento, casa, ph, oficina, local_comercial, galpon, lote, quinta, chacra, estudio, loft, duplex, triplex), estado (disponible), provincia, localidad (por nombre), dirección, cantidad de ambientes, cantidad de dormitorios, y rangos de precios. También soporta paginación y ordenamiento. Puedes especificar características como aire acondicionado, calefacción, piscina, etc.',
          parameters: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: [
                  'departamento',
                  'casa',
                  'ph',
                  'oficina',
                  'local_comercial',
                  'galpon',
                  'lote',
                  'quinta',
                  'chacra',
                  'estudio',
                  'loft',
                  'duplex',
                  'triplex',
                ],
                description: 'Tipo de propiedad (ej: departamento, casa, ph).',
              },
              status: {
                type: 'string',
                description: 'Estado de la propiedad (ej: disponible).',
              },
              province: {
                type: 'string',
                description: 'ID o nombre de la provincia.',
              },
              localityName: {
                type: 'string',
                description: 'Nombre de la localidad (ej: Rawson, Córdoba).',
              },
              address: {
                type: 'string',
                description: 'Parte de la dirección de la propiedad.',
              },
              rooms: {
                type: 'number',
                description: 'Cantidad total de ambientes de la propiedad.',
              },
              bedrooms: {
                type: 'number',
                description: 'Cantidad de dormitorios de la propiedad.',
              },
              minPrice: {
                type: 'number',
                description: 'Precio mínimo de la propiedad.',
              },
              maxPrice: {
                type: 'number',
                description: 'Precio máximo de la propiedad.',
              },
              page: {
                type: 'number',
                description:
                  'Número de página para la paginación (empieza en 0).',
              },
              pageSize: {
                type: 'number',
                description: 'Cantidad de resultados por página.',
              },
              sort: {
                type: 'string',
                description:
                  'Campo para ordenar los resultados (ej: address, -createdAt para descendente).',
              },
              specs: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: [
                    'aire_acondicionado',
                    'calefaccion',
                    'portero',
                    'ascensor',
                    'cochera',
                    'piscina',
                    'jardin',
                    'parrilla',
                    'balcon',
                    'terraza',
                    'lavadero',
                    'baulera',
                    'sum',
                    'gimnasio',
                    'seguridad_24h',
                  ],
                },
                description: 'Lista de características de la propiedad (ej: piscina, cochera).',
              },
              // Advanced search parameter - OpenAI will need to construct this JSON string
              search: {
                type: 'string',
                description:
                  'String JSON codificado con criterios de búsqueda avanzada (ej: {"criteria":[{"field":"locality","term":"ID_LOCALIDAD","operation":"eq"}]}).',
              },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'getAvailableLocalities',
          description:
            'Obtiene una lista de localidades donde hay propiedades disponibles para venta o alquiler.',
          parameters: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['all', 'sale', 'rent'],
                description:
                  'Tipo de publicación (all, sale, rent). Por defecto es all.',
              },
            },
          },
        },
      },
    ];

    let assistantResponse: ChatCompletionMessage =
      await this.openaiService.getChatCompletion(messages, tools);

    // Handle function calls
    if (
      assistantResponse.tool_calls &&
      assistantResponse.tool_calls.length > 0
    ) {
      const toolCall = assistantResponse.tool_calls[0]; // Assuming one tool call for simplicity
      const functionName = (toolCall as any).function.name; // Cast to any
      const functionArgs = JSON.parse(
        (toolCall as any).function.arguments || '{}',
      ); // Cast to any

      const functionOutput = await this.functionsService.callFunction(
        functionName,
        functionArgs,
      );

      // Add function response to messages
      messages.push(assistantResponse as ChatCompletionMessageParam); // Assistant's tool call message
      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id || '',
        content: JSON.stringify(functionOutput),
      });

      // Get final response from OpenAI after function execution
      assistantResponse = await this.openaiService.getChatCompletion(
        messages,
        tools,
      );
    }

    // Save assistant's final response
    const assistantMessage = new this.messageModel({
      threadId,
      role: assistantResponse.role || 'assistant',
      content: assistantResponse.content || '',
      ...(assistantResponse.function_call && {
        functionCall: assistantResponse.function_call as any,
      }),
    });
    await assistantMessage.save();
    await this.threadModel
      .findByIdAndUpdate(threadId, {
        $push: { messages: assistantMessage._id },
      })
      .exec();

    return assistantMessage;
  }

  async deleteThread(threadId: string): Promise<any> {
    await this.messageModel.deleteMany({ threadId }).exec();
    return this.threadModel.findByIdAndDelete(threadId).exec();
  }
}
