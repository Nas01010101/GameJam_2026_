using UnityEngine;
using System;
using System.Collections.Generic;

public class StoneManager : MonoBehaviour
{
    public GameObject stonePrefab;
    public Transform spawnParent;

    public void GenerateChoices(EmotionData correct,
        Action<EmotionData> callback)
    {
        foreach (Transform child in spawnParent)
            Destroy(child.gameObject);

        List<EmotionData> choices =
            FakeEmotionGenerator.GetThree(correct);

        foreach (EmotionData e in choices)
        {
            GameObject stone =
                Instantiate(stonePrefab, spawnParent);
            if(stone != null)
            {
                Debug.Log("STONESPAWNED++");
                stone.GetComponent<Stone>()
                .Setup(e, callback);
            }
            else
            {
                Debug.Log(e.ToString());
                Debug.Log("NULL");
            }
           
        }
    }
}