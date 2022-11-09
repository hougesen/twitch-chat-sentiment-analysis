import { ObjectId } from 'mongodb';
import type { NextApiRequest, NextApiResponse } from 'next';
import { MissingFieldError } from '../../../lib/errors';
import getDbClient from '../../../lib/mongodb';
import { IEmote } from '../../../types/models';

async function getEmoteById(emoteId: string): Promise<IEmote | null> {
    const db = await getDbClient();

    const emote = await db.collection('twitch_emotes').findOne({ _id: new ObjectId(emoteId) });

    return emote as IEmote | null;
}

async function updateEmoteById(emoteId: string, score: number): Promise<IEmote | null> {
    if (typeof score !== 'number') {
        throw new MissingFieldError('score');
    }

    const db = await getDbClient();

    const updatedEmote = {
        score,
    };

    const emote = await db.collection('twitch_emotes').findOneAndUpdate(
        {
            _id: new ObjectId(emoteId),
        },
        {
            $set: updatedEmote,
        }
    );

    return emote?.value as IEmote | null;
}

async function deleteEmoteById(emoteId: string) {
    const db = await getDbClient();

    await db.collection('twitch_emotes').deleteOne({ _id: new ObjectId(emoteId) });
}

export default function handler(req: NextApiRequest, res: NextApiResponse<IEmote | null | void | { error: unknown }>) {
    const emoteId = req?.query?.emoteId;

    if (!emoteId || typeof emoteId !== 'string') {
        return res.status(400).send({ error: 'channel_id is not a string' });
    }

    switch (req.method) {
        case 'GET':
            return getEmoteById(emoteId)
                .then((emote) => res.status(emote ? 200 : 404).send(emote))
                .catch((error?: Error) => res.status(400).send({ error: error?.message ?? error }));

        case 'PUT':
            return updateEmoteById(emoteId, req.body.score)
                .then((emote) => res.status(200).send(emote))
                .catch((error?: Error) => res.status(400).send({ error: error?.message ?? error }));

        case 'DELETE':
            return deleteEmoteById(emoteId)
                .then(() => res.status(200).send())
                .catch((error?: Error) => res.status(400).send({ error: error?.message ?? error }));

        default:
            return res.status(405).send({ error: 'Method not allowed.' });
    }
}