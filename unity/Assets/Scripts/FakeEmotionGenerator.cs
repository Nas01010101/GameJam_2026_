using System.Collections.Generic;
using UnityEngine;
using System.Linq;

public static class FakeEmotionGenerator
{
    public static List<EmotionData> GetThree(EmotionData correct)
    {
        EmotionDatabase db =
            GameObject.FindObjectOfType<EmotionDatabase>();

        List<EmotionData> pool =
            new List<EmotionData>(db.emotions);

        // remove correct from pool
        pool.Remove(correct);

        // shuffle distractors
        Shuffle(pool);

        List<EmotionData> result = new List<EmotionData>();

        result.Add(correct);
        result.Add(pool[0]);
        result.Add(pool[1]);

        // shuffle final order so correct isn't predictable
        Shuffle(result);

        return result;
    }

    static void Shuffle<T>(List<T> list)
    {
        for (int i = 0; i < list.Count; i++)
        {
            int rand = Random.Range(i, list.Count);
            T temp = list[i];
            list[i] = list[rand];
            list[rand] = temp;
        }
    }
}