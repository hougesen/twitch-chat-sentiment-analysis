import { Document, WithId } from 'mongodb';

export declare interface IChannel extends WithId<Document> {
    channel_name: string;
    channel_id?: string;
}

export declare interface IEmote extends WithId<Document> {
    emote_id: string;
    name: string;
    channel_id?: string;
    score?: number;
}

export declare interface ITwitchChatMessage extends WithId<Document> {
    channel: string;
    sender: string;
    message: string;
    timestamp: Date | string;
}
