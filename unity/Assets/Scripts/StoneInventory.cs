using System.Collections.Generic;
using UnityEngine;

public class StoneInventory : MonoBehaviour
{
    public static StoneInventory Instance;

    private HashSet<string> collected =
        new HashSet<string>();

    void Awake()
    {
        Instance = this;
    }

    public void Collect(EmotionData emotion)
    {
        if (!collected.Contains(emotion.emotionName))
        {
            collected.Add(emotion.emotionName);
            Debug.Log("Collected: " + emotion.emotionName);
        }
    }

    public int Count()
    {
        return collected.Count;
    }
}
