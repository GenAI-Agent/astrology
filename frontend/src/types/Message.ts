export interface Message {
  role: 'human' | 'ai';
  content: string;
  type: 'text' | 'tool_use' | 'tool_result';
  sources?: any[];
  prompts?: any[];
  tool_id?: string;
  tool_name?: string;
  tool_args?: any;
  tool_result?: any;
}