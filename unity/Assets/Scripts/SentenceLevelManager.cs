using UnityEngine;

public class SentenceLevelManager : MonoBehaviour
{
    public EmotionDatabase database;
    public StoneManager stones;

    private EmotionData currentEmotion;
    private int errors = 0;

    void Start()
    {
        NextSituation();
    }

    void NextSituation()
    {
        currentEmotion = database.GetNextEmotion();
        stones.GenerateChoices(currentEmotion, Evaluate);
    }

    void Evaluate(EmotionData chosen)
    {
        AudioSource.PlayClipAtPoint(chosen.pronunciation, Vector3.zero);

        if (chosen == currentEmotion)
        {
            errors = 0;
            OpenGate();
            Invoke(nameof(NextSituation), 2f);
        }
        else
        {
            errors++;

            if (errors >= 3)
                FindObjectOfType<BreathingSystem>().StartBreathing();
        }
    }

    void OpenGate()
    {
        Debug.Log("Gate Opens");
    }
}