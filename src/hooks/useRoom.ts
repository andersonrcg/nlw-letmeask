import { useEffect, useState } from "react";
import { database } from "../services/firebase";
import { useAuth } from "./useAuth";

type QuestionType = {
    id: string;
    author: {
        name: string;
        avatar: string;
    }
    content: string;
    isAnswered: boolean;
    isHighlighted: boolean;
    likeCount: number;
    likeId: string | undefined;
}

type FirebaseQuestions = Record<string, {
    author: {
        name: string;
        avatar: string;
    },
    content: string;
    isAnswered: boolean;
    isHighlighted: boolean;
    likes: Record<string, {
        authorId: string;
    }>
}>

export function useRoom(roomId: string) {
    const { user } = useAuth(); 
    const [questions, setQuestions] = useState<QuestionType[]>([]);
    const [title, setTitle] = useState('');
    const [authorIdRoom, setAuthorIdRoom] = useState('');
    const [endedRoom, setEndedRoom] = useState(false);

    useEffect(() => {
        const roomRef = database.ref(`rooms/${roomId}`);

        roomRef.on('value', room => {
            const databaseRoom = room.val();

            if(databaseRoom?.endedAt) {
                setEndedRoom(true);
            }

            const firebaseQuestions: FirebaseQuestions = databaseRoom?.questions ?? {};

            const parsedQuestions = Object.entries(firebaseQuestions).map(([key, value]) => {
                return {
                    id: key,
                    content: value.content,
                    author: value.author,
                    isHighlighted: value.isHighlighted,
                    isAnswered: value.isAnswered,
                    likeCount: Object.values(value.likes ?? {}).length,
                    likeId: Object.entries(value.likes ?? {}).find(([key, like]) => like.authorId === user?.id)?.[0],
                }
            })

            const questionsSorted = parsedQuestions.sort((a, b)=> a.likeCount - b.likeCount);

            setTitle(databaseRoom?.title)
            setAuthorIdRoom(databaseRoom?.authorId)
            setQuestions(questionsSorted)
        })

        return () => {
            roomRef.off('value');
        }
    }, [roomId, user?.id])

    return { questions, title, authorIdRoom, endedRoom };
}