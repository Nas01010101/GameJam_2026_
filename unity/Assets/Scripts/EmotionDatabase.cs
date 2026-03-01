using UnityEngine;
using System.Collections.Generic;


public class EmotionDatabase : MonoBehaviour
{
    public List<EmotionData> emotions;

    private Queue<EmotionData> learningQueue;

    

    void Awake()
    {
        learningQueue = new Queue<EmotionData>(emotions);
    }

    private void Start()
    {
       
    }

    public EmotionData GetNextEmotion()
    {
        EmotionData e = learningQueue.Dequeue();
        learningQueue.Enqueue(e); // répétition espacée implicite
        return e;
    }
}