export interface ChatBotMessage {
    sender: 'user' | 'received';
    text: string;
}